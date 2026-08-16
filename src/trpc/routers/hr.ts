import { router, publicProcedure, adminProcedure } from "@/lib/trpc";
import { prisma } from "@/lib/prisma";
import { emitToTenant } from "@/lib/socket";
import { invitationLink, sendInvitationEmail } from "@/lib/mail";
import { removeUpload } from "@/lib/uploads";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import path from "node:path";
import { unlink } from "node:fs/promises";
import { z } from "zod";

const EMPLOYEE_ROLES = ["CASHIER", "COOK", "WAITER"] as const;

const employeeSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Correo inválido"),
  role: z.enum(EMPLOYEE_ROLES),
  phone: z.string().optional(),
  photoUrl: z.string().optional(),
  idDocUrl: z.string().optional(),
  contractEnd: z.string().optional(),
  hourlyRateCents: z.number().int().min(0, "El salario no puede ser negativo"),
  startDate: z.string().optional(),
  schedule: z.string().optional(),
  isActive: z.boolean().default(true),
});

const INVITE_TTL_MS = 72 * 60 * 60 * 1000;

function newInviteToken() {
  return randomBytes(32).toString("hex");
}

async function createInviteForUser(userId: string) {
  const token = newInviteToken();
  await prisma.user.update({
    where: { id: userId },
    data: {
      inviteToken: token,
      inviteTokenExpiresAt: new Date(Date.now() + INVITE_TTL_MS),
      invitedAt: new Date(),
    },
  });
  return token;
}

async function emailInvite(user: { id: string; email: string; name: string; tenantId: string }) {
  const token = await createInviteForUser(user.id);
  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
  });
  const link = invitationLink(token);
  const sent = await sendInvitationEmail({
    to: user.email,
    name: user.name,
    restaurant: tenant?.name ?? "tu restaurante",
    link,
  });
  return { link, sent };
}

function removeUserImage(userImage: string | null) {
  if (!userImage || !userImage.startsWith("/uploads/")) return;
  const filePath = path.join(process.cwd(), "public", userImage);
  try {
    unlink(filePath).catch(() => {});
  } catch {
    /* sin archivo, sin problema */
  }
}

export const hrRouter = router({
  getEmployees: adminProcedure.query(async ({ ctx }) => {
    return prisma.employee.findMany({
      where: { tenantId: ctx.user.tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, invitedAt: true, passwordHash: true } },
      },
    });
  }),

  createEmployee: adminProcedure
    .input(employeeSchema)
    .mutation(async ({ ctx, input }) => {
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });
      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ya existe un usuario con ese correo",
        });
      }
      const existingEmployee = await prisma.employee.findUnique({
        where: { email: input.email },
      });
      if (existingEmployee) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ya existe un empleado con ese correo",
        });
      }

      const id = ctx.user.tenantId;
      const employee = await prisma.employee.create({
        data: {
          tenantId: id,
          name: input.name,
          email: input.email,
          role: input.role,
          phone: input.phone,
          photoUrl: input.photoUrl,
          idDocUrl: input.idDocUrl,
          contractEnd: input.contractEnd ? new Date(input.contractEnd) : null,
          hourlyRateCents: input.hourlyRateCents,
          startDate: input.startDate ? new Date(input.startDate) : null,
          schedule: input.schedule,
          isActive: input.isActive,
        },
      });
      const user = await prisma.user.create({
        data: {
          tenantId: id,
          name: input.name,
          email: input.email,
          role: input.role,
        },
      });
      await prisma.employee.update({
        where: { id: employee.id },
        data: { userId: user.id },
      });

      emitToTenant(id, "hr:changed", { type: "employee:created", id: employee.id });

      const { link, sent } = await emailInvite(user);
      return { employee, mailSent: sent, inviteLink: link };
    }),

  updateEmployee: adminProcedure
    .input(z.object({ id: z.string() }).merge(employeeSchema))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.employee.findUnique({
        where: { id: input.id, tenantId: ctx.user.tenantId },
        include: { user: true },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Empleado no encontrado" });
      }

      if (input.email !== existing.email) {
        const conflict = await prisma.user.findUnique({ where: { email: input.email } });
        const conflictEmp = await prisma.employee.findUnique({
          where: { email: input.email },
        });
        if (conflict || (conflictEmp && conflictEmp.id !== existing.id)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Ya existe un empleado o usuario con ese correo",
          });
        }
      }

      const employee = await prisma.employee.update({
        where: { id: input.id, tenantId: ctx.user.tenantId },
        data: {
          name: input.name,
          email: input.email,
          role: input.role,
          phone: input.phone,
          photoUrl: input.photoUrl,
          idDocUrl: input.idDocUrl,
          contractEnd: input.contractEnd ? new Date(input.contractEnd) : null,
          hourlyRateCents: input.hourlyRateCents,
          startDate: input.startDate ? new Date(input.startDate) : null,
          schedule: input.schedule,
          isActive: input.isActive,
        },
      });

      await Promise.all([
        existing.photoUrl && existing.photoUrl !== input.photoUrl
          ? removeUpload(existing.photoUrl, ctx.user.tenantId)
          : Promise.resolve(),
        existing.idDocUrl && existing.idDocUrl !== input.idDocUrl
          ? removeUpload(existing.idDocUrl, ctx.user.tenantId)
          : Promise.resolve(),
      ]);

      if (existing.user) {
        const userEmailChanged = existing.user.email !== input.email;
        await prisma.user.update({
          where: { id: existing.user.id },
          data: {
            name: input.name,
            email: input.email,
            role: input.role,
            passwordHash: userEmailChanged ? null : existing.user.passwordHash,
          },
        });
        if (userEmailChanged) {
          const updatedUser = await prisma.user.findUnique({
            where: { id: existing.user.id },
          });
          if (updatedUser) {
            const { link, sent } = await emailInvite(updatedUser);
            emitToTenant(ctx.user.tenantId, "hr:changed", { type: "employee:updated", id: employee.id });
            return { employee, mailSent: sent, inviteLink: link, reInvited: true };
          }
        }
      }

      emitToTenant(ctx.user.tenantId, "hr:changed", { type: "employee:updated", id: employee.id });
      return employee;
    }),

  deleteEmployee: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const employee = await prisma.employee.findUnique({
        where: { id: input.id, tenantId: ctx.user.tenantId },
        include: { user: true },
      });
      if (!employee) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Empleado no encontrado" });
      }
      if (employee.user?.id === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No podés eliminar tu propio empleado",
        });
      }

      const userId = employee.userId;
      await prisma.employee.delete({ where: { id: input.id, tenantId: ctx.user.tenantId } });

      await Promise.all([
        removeUpload(employee.photoUrl, ctx.user.tenantId),
        removeUpload(employee.idDocUrl, ctx.user.tenantId),
      ]);

      if (userId) {
        const [orders, attendances, own] = await Promise.all([
          prisma.order.count({ where: { userId } }),
          prisma.attendance.count({ where: { userId } }),
          prisma.employee.count({ where: { userId } }),
        ]);
        if (orders === 0 && attendances === 0 && own === 0) {
          const user = await prisma.user.findUnique({ where: { id: userId } });
          removeUserImage(user?.image ?? null);
          await prisma.user.delete({ where: { id: userId } }).catch(() => {});
        }
      }

      emitToTenant(ctx.user.tenantId, "hr:changed", { type: "employee:deleted", id: input.id });
      return { ok: true };
    }),

  resendInvitation: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const employee = await prisma.employee.findUnique({
        where: { id: input.id, tenantId: ctx.user.tenantId },
        include: { user: true },
      });
      if (!employee) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Empleado no encontrado" });
      }
      if (!employee.user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este empleado no tiene usuario asociado",
        });
      }
      const { link, sent } = await emailInvite(employee.user);
      emitToTenant(ctx.user.tenantId, "hr:changed", { type: "employee:resend", id: input.id });
      return { mailSent: sent, inviteLink: link };
    }),

  getInviteUser: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { inviteToken: input.token },
        include: { tenant: true },
      });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitación no encontrada" });
      }
      if (user.inviteTokenExpiresAt && user.inviteTokenExpiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "La invitación expiró. Pedile a tu administrador que la reenvíe",
        });
      }
      if (user.passwordHash) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta invitación ya fue utilizada",
        });
      }
      return {
        name: user.name,
        email: user.email,
        restaurant: user.tenant.name,
      };
    }),

  acceptInvitation: publicProcedure
    .input(
      z.object({
        token: z.string().min(1),
        password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
      }),
    )
    .mutation(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { inviteToken: input.token },
      });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitación no encontrada" });
      }
      if (user.inviteTokenExpiresAt && user.inviteTokenExpiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "La invitación expiró. Pedile a tu administrador que la reenvíe",
        });
      }
      if (user.passwordHash) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta invitación ya fue utilizada",
        });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: await bcrypt.hash(input.password, 10),
          inviteToken: null,
          inviteTokenExpiresAt: null,
          emailVerified: new Date(),
        },
      });
      return { ok: true };
    }),
});
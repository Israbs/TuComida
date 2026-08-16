import { router, protectedProcedure, managerProcedure } from "@/lib/trpc";
import { prisma } from "@/lib/prisma";
import { emitToTenant } from "@/lib/socket";
import {
  attendanceCode,
  codeRemainingSeconds,
  newAttendanceSecret,
  verifyAttendanceCode,
} from "@/lib/totp";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const EARLY_IN_MINUTES = 15;
const EARLY_OUT_MINUTES = 180;

type ScheduleEntry = { day: number; start: string; end: string };

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function parseSchedule(raw: string | null | undefined): ScheduleEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ScheduleEntry[]) : [];
  } catch {
    return [];
  }
}

function scheduleDayFromJs(jsDay: number): number {
  return (jsDay + 6) % 7;
}

function entryForToday(schedule: ScheduleEntry[]): ScheduleEntry | null {
  const day = scheduleDayFromJs(new Date().getDay());
  return schedule.find((e) => e.day === day) ?? null;
}

function parseHHMM(hhmm: string): { h: number; m: number } {
  const [h, m] = hhmm.split(":").map(Number);
  return { h: h || 0, m: m || 0 };
}

function timeForToday(hhmm: string): Date {
  const { h, m } = parseHHMM(hhmm);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay() + 1); // lunes
  return d;
}

async function tenantSecret(tenantId: string): Promise<string> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Establecimiento no encontrado" });
  }
  if (tenant.attendanceSecret) return tenant.attendanceSecret;
  const secret = newAttendanceSecret();
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { attendanceSecret: secret },
  });
  return secret;
}

export const attendanceRouter = router({
  getMyStatus: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true },
    });

    const empty = {
      hasProfile: false,
      employeeName: user?.name ?? "",
      today: null as {
        schedule: ScheduleEntry | null;
        openPunch: { id: string; clockIn: Date; source: string } | null;
        hasWorkedToday: boolean;
        workedSeconds: number;
      } | null,
      week: [] as {
        date: string;
        day: string;
        scheduled: ScheduleEntry | null;
        clockIn: Date | null;
        clockOut: Date | null;
        seconds: number;
        isOpen: boolean;
      }[],
      weekTotalSeconds: 0,
    };

    if (!user?.employee) return empty;

    const employee = user.employee;
    const schedule = parseSchedule(employee.schedule);
    const todayStart = startOfToday();
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const [todayAttendances, weekAttendances] = await Promise.all([
      prisma.attendance.findMany({
        where: { userId, clockIn: { gte: todayStart, lt: tomorrowStart } },
        orderBy: { clockIn: "asc" },
      }),
      prisma.attendance.findMany({
        where: { userId, clockIn: { gte: startOfWeek() } },
        orderBy: { clockIn: "asc" },
      }),
    ]);

    const open = todayAttendances.find((a) => !a.clockOut) ?? null;
    const completedToday = todayAttendances.filter((a) => a.clockOut);
    const workedTodaySeconds =
      completedToday.reduce(
        (acc, a) => acc + (a.clockOut!.getTime() - a.clockIn.getTime()) / 1000,
        0,
      ) + (open ? (Date.now() - open.clockIn.getTime()) / 1000 : 0);

    const weekMap = new Map<string, (typeof weekAttendances)[number][]>();
    for (const a of weekAttendances) {
      const key = a.clockIn.toISOString().slice(0, 10);
      const arr = weekMap.get(key) ?? [];
      arr.push(a);
      weekMap.set(key, arr);
    }

    const week: typeof empty.week = [];
    const weekStart = startOfWeek();
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000);
      const key = date.toISOString().slice(0, 10);
      const daySchedule = schedule.find((e) => e.day === i) ?? null;
      const punches = weekMap.get(key) ?? [];
      const dayOpen = punches.find((a) => !a.clockOut) ?? null;
      const completed = punches.filter((a) => a.clockOut);
      const seconds =
        completed.reduce(
          (acc, a) => acc + (a.clockOut!.getTime() - a.clockIn.getTime()) / 1000,
          0,
        ) + (dayOpen ? (Date.now() - dayOpen.clockIn.getTime()) / 1000 : 0);
      week.push({
        date: key,
        day: DAY_LABELS[i],
        scheduled: daySchedule,
        clockIn: dayOpen?.clockIn ?? completed[0]?.clockIn ?? null,
        clockOut: dayOpen ? null : completed[completed.length - 1]?.clockOut ?? null,
        seconds,
        isOpen: !!dayOpen,
      });
    }

    const weekTotalSeconds = week.reduce((acc, d) => acc + d.seconds, 0);

    return {
      hasProfile: true,
      employeeName: employee.name,
      isActive: employee.isActive,
      hourlyRateCents: employee.hourlyRateCents,
      today: {
        schedule: entryForToday(schedule),
        openPunch: open
          ? { id: open.id, clockIn: open.clockIn, source: open.source }
          : null,
        hasWorkedToday: completedToday.length > 0,
        workedSeconds: Math.floor(workedTodaySeconds),
      },
      week,
      weekTotalSeconds: Math.floor(weekTotalSeconds),
    };
  }),

  getCode: managerProcedure.query(async ({ ctx }) => {
    const secret = await tenantSecret(ctx.user.tenantId);
    return {
      code: attendanceCode(secret),
      expiresIn: codeRemainingSeconds(),
    };
  }),

  punch: protectedProcedure
    .input(z.object({ action: z.enum(["in", "out"]), code: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const secret = await tenantSecret(ctx.user.tenantId);
      if (!verifyAttendanceCode(secret, input.code)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Código de pantalla incorrecto",
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: ctx.user.id },
        include: { employee: true },
      });
      if (!user?.employee) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tu usuario no tiene perfil de empleado",
        });
      }
      const employee = user.employee;
      if (!employee.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tu perfil está inactivo. Consultá con tu administrador",
        });
      }

      const schedule = parseSchedule(employee.schedule);
      const now = new Date();
      const hourlyRate = employee.hourlyRateCents / 100;

      if (input.action === "in") {
        const open = await prisma.attendance.findFirst({
          where: { userId: user.id, clockOut: null },
        });
        if (open) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Ya tenés un turno abierto. Cerrá el anterior antes de marcar entrada",
          });
        }
        const entry = entryForToday(schedule);
        if (entry) {
          const start = timeForToday(entry.start);
          if (now.getTime() < start.getTime() - EARLY_IN_MINUTES * 60 * 1000) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Todavía no podés marcar entrada. Tu turno empieza a las ${entry.start}`,
            });
          }
        }
        const created = await prisma.attendance.create({
          data: {
            tenantId: user.tenantId,
            userId: user.id,
            clockIn: now,
            hourlyRate,
            source: "employee",
          },
        });
        emitToTenant(user.tenantId, "attendance:changed", {
          type: "in",
          userId: user.id,
        });
        return { attendanceId: created.id, clockIn: created.clockIn, clockOut: null };
      }

      const open = await prisma.attendance.findFirst({
        where: { userId: user.id, clockOut: null },
      });
      if (!open) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No tenés un turno abierto para cerrar",
        });
      }
      const entry = entryForToday(schedule);
      if (entry?.end) {
        const end = timeForToday(entry.end);
        if (now.getTime() < end.getTime() - EARLY_OUT_MINUTES * 60 * 1000) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Todavía no podés marcar salida. Tu turno termina a las ${entry.end}`,
          });
        }
      }
      const updated = await prisma.attendance.update({
        where: { id: open.id },
        data: { clockOut: now },
      });
      emitToTenant(user.tenantId, "attendance:changed", {
        type: "out",
        userId: user.id,
      });
      return {
        attendanceId: updated.id,
        clockIn: updated.clockIn,
        clockOut: updated.clockOut,
      };
    }),

  getTodayBoard: managerProcedure.query(async ({ ctx }) => {
    const todayStart = startOfToday();
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const employees = await prisma.employee.findMany({
      where: { tenantId: ctx.user.tenantId, isActive: true, user: { isNot: null } },
      include: { user: true },
    });

    const attendances = await prisma.attendance.findMany({
      where: {
        tenantId: ctx.user.tenantId,
        clockIn: { gte: todayStart, lt: tomorrowStart },
      },
      orderBy: { clockIn: "asc" },
    });

    const byUser = new Map<string, typeof attendances>();
    for (const a of attendances) {
      const arr = byUser.get(a.userId) ?? [];
      arr.push(a);
      byUser.set(a.userId, arr);
    }

    const rows = employees.map((e) => {
      const schedule = parseSchedule(e.schedule);
      const entry = entryForToday(schedule);
      const punches = byUser.get(e.user!.id) ?? [];
      const open = punches.find((a) => !a.clockOut) ?? null;
      const completed = punches.filter((a) => a.clockOut);
      const firstIn = punches[0]?.clockIn ?? null;
      const lastOut = completed[completed.length - 1]?.clockOut ?? null;
      const workedSeconds =
        completed.reduce(
          (acc, a) => acc + (a.clockOut!.getTime() - a.clockIn.getTime()) / 1000,
          0,
        ) + (open ? (Date.now() - open.clockIn.getTime()) / 1000 : 0);

      let status: "rest" | "present" | "late" | "done" | "missing";
      if (!entry) {
        status = "rest";
      } else if (open) {
        const start = timeForToday(entry.start);
        status = firstIn && firstIn.getTime() > start.getTime() + 5 * 60 * 1000 ? "late" : "present";
      } else if (completed.length > 0) {
        status = "done";
      } else {
        status = "missing";
      }

      return {
        id: e.id,
        userId: e.user!.id,
        name: e.name,
        role: e.role,
        photoUrl: e.photoUrl,
        schedule: entry,
        status,
        clockIn: firstIn,
        clockOut: lastOut,
        isOpen: !!open,
        workedSeconds: Math.floor(workedSeconds),
        punches: punches.map((p) => ({
          id: p.id,
          clockIn: p.clockIn,
          clockOut: p.clockOut,
        })),
      };
    });

    const rank: Record<string, number> = {
      present: 0,
      late: 1,
      done: 2,
      missing: 3,
      rest: 4,
    };
    rows.sort((a, b) => rank[a.status] - rank[b.status]);

    return rows;
  }),

  savePunch: managerProcedure
    .input(
      z
        .object({
          attendanceId: z.string().optional(),
          userId: z.string().optional(),
          clockIn: z.string().min(1),
          clockOut: z.string().nullable().optional(),
          notes: z.string().optional(),
        })
        .refine((v) => v.attendanceId || v.userId, {
          message: "Se necesita attendanceId o userId",
        }),
    )
    .mutation(async ({ ctx, input }) => {
      const clockIn = new Date(input.clockIn);
      const clockOut = input.clockOut ? new Date(input.clockOut) : null;
      if (isNaN(clockIn.getTime()) || (clockOut && isNaN(clockOut.getTime()))) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Fechas inválidas" });
      }
      if (clockOut && clockOut.getTime() < clockIn.getTime()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "La salida no puede ser anterior a la entrada",
        });
      }

      const tenantId = ctx.user.tenantId;
      const now = new Date();

      if (input.attendanceId) {
        const existing = await prisma.attendance.findUnique({
          where: { id: input.attendanceId },
        });
        if (!existing || existing.tenantId !== tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Registro no encontrado" });
        }
        await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            clockIn,
            clockOut,
            notes: input.notes,
            source: "correction",
            adjustedBy: ctx.user.id,
            adjustedAt: now,
          },
        });
      } else {
        const targetUser = await prisma.user.findUnique({
          where: { id: input.userId! },
          include: { employee: true },
        });
        if (!targetUser || targetUser.tenantId !== tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Empleado no encontrado" });
        }
        await prisma.attendance.create({
          data: {
            tenantId,
            userId: targetUser.id,
            clockIn,
            clockOut,
            notes: input.notes,
            hourlyRate: (targetUser.employee?.hourlyRateCents ?? 0) / 100,
            source: "admin",
            adjustedBy: ctx.user.id,
            adjustedAt: now,
          },
        });
      }

      emitToTenant(tenantId, "attendance:changed", {
        type: "corrected",
      });
      return { ok: true };
    }),
});
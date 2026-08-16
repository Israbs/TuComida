"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import {
  SUBSCRIPTION_BILLING_CYCLE,
  SUBSCRIPTION_PERIOD_DAYS,
  SUBSCRIPTION_PLAN,
} from "@/lib/subscription";

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

async function uniqueSlug(base: string): Promise<string> {
  const root = base || "restaurante";
  let slug = root;
  let n = 2;
  while (await prisma.tenant.findUnique({ where: { slug } })) {
    slug = `${root}-${n}`;
    n += 1;
  }
  return slug;
}

export async function registerAction(formData: FormData) {
  const restaurant = String(formData.get("restaurant") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const fail = (code: string) => {
    redirect(`/register?error=${encodeURIComponent(code)}`);
  };

  if (!restaurant || restaurant.length < 2) fail("restaurant");
  if (!name || name.length < 2) fail("name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("email");
  if (password.length < 6) fail("password");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) fail("taken");

  const tenant = await prisma.tenant.create({
    data: {
      name: restaurant,
      slug: await uniqueSlug(slugify(restaurant)),
      subscription: {
        create: {
          plan: SUBSCRIPTION_PLAN,
          billingCycle: SUBSCRIPTION_BILLING_CYCLE,
          status: "active",
          currentPeriodEnd: new Date(
            Date.now() + SUBSCRIPTION_PERIOD_DAYS * 24 * 60 * 60 * 1000,
          ),
        },
      },
    },
  });

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name,
      email,
      passwordHash,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      fail("login");
    }
    throw error;
  }

  redirect("/");
}
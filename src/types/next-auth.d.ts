import type { UserRole } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface User {
    role?: UserRole;
    tenantId?: string;
    tenantSlug?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      tenantId: string;
      tenantSlug: string;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    tenantId: string;
    tenantSlug: string;
  }
}

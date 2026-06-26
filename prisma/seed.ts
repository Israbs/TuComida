import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-restaurant" },
    update: {},
    create: {
      name: "Demo Restaurant",
      slug: "demo-restaurant",
    },
  });

  const adminPassword = await bcrypt.hash("admin123", 10);
  const cashierPassword = await bcrypt.hash("cajero123", 10);
  const cookPassword = await bcrypt.hash("cocinero123", 10);
  const waiterPassword = await bcrypt.hash("mesero123", 10);

  const users = [
    { email: "admin@demo.com", name: "Admin Demo", password: adminPassword, role: "ADMIN" as const },
    { email: "cajero@demo.com", name: "Cajero Demo", password: cashierPassword, role: "CASHIER" as const },
    { email: "cocinero@demo.com", name: "Cocinero Demo", password: cookPassword, role: "COOK" as const },
    { email: "mesero@demo.com", name: "Mesero Demo", password: waiterPassword, role: "WAITER" as const },
  ];

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      await prisma.user.create({
        data: { tenantId: tenant.id, ...u },
      });
    }
  }

  const categoryNames = ["Bebidas", "Platos Principales", "Entradas", "Postres"];
  for (let i = 0; i < categoryNames.length; i++) {
    const existing = await prisma.category.findFirst({
      where: { tenantId: tenant.id, name: categoryNames[i] },
    });
    if (!existing) {
      await prisma.category.create({
        data: {
          tenantId: tenant.id,
          name: categoryNames[i],
          sortOrder: i + 1,
        },
      });
    }
  }

  for (let i = 1; i <= 10; i++) {
    await prisma.table.upsert({
      where: { tenantId_number: { tenantId: tenant.id, number: i } },
      update: {},
      create: {
        tenantId: tenant.id,
        number: i,
        name: `Mesa ${i}`,
      },
    });
  }

  console.log("Seed completado exitosamente!");
  console.log("Usuarios creados:");
  console.log("  admin@demo.com / admin123");
  console.log("  cajero@demo.com / cajero123");
  console.log("  cocinero@demo.com / cocinero123");
  console.log("  mesero@demo.com / mesero123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

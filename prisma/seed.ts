import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

type Role = "ADMIN" | "CASHIER" | "COOK" | "WAITER";

type Staff = {
  local: string;
  name: string;
  role: Role;
  rate: number;
  password: string;
  days: number[];
  start: string;
  end: string;
};

type Product = {
  category: string;
  name: string;
  description: string;
  priceCents: number;
  image: string;
  ingredients: string[];
  addons?: { name: string; priceCents: number }[];
};

type Restaurant = {
  name: string;
  slug: string;
  emailDomain: string;
  staff: Staff[];
  categories: string[];
  products: Product[];
  tables: number;
};

const RESTAURANTS: Restaurant[] = [
  {
    name: "La Parra",
    slug: "la-parra",
    emailDomain: "laparra.com",
    staff: [
      { local: "admin", name: "Marcela Ruiz", role: "ADMIN", rate: 1400, password: "admin123", days: [0, 1, 2, 3, 4, 5], start: "09:00", end: "17:00" },
      { local: "cajero", name: "Julián Castro", role: "CASHIER", rate: 1000, password: "cajero123", days: [1, 2, 3, 4, 5], start: "10:00", end: "18:00" },
      { local: "cocinero", name: "Diego Peralta", role: "COOK", rate: 1200, password: "cocinero123", days: [1, 2, 3, 4, 5, 6], start: "11:00", end: "21:00" },
      { local: "mesero", name: "Carla Medina", role: "WAITER", rate: 950, password: "mesero123", days: [1, 2, 3, 4, 5, 6], start: "11:30", end: "20:30" },
      { local: "mesero2", name: "Franco Torres", role: "WAITER", rate: 900, password: "mesero123", days: [2, 3, 4, 5, 6, 0], start: "12:00", end: "21:00" },
    ],
    categories: ["Bebidas", "Entradas", "Parrilla", "Guarniciones", "Postres"],
    products: [
      {
        category: "Bebidas",
        name: "Gaseosa de Pomelo",
        description: "Soda de pomelo con hielo y rodaja de lima.",
        priceCents: 2500,
        image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=70",
        ingredients: ["Pomelo", "Soda", "Lima"],
      },
      {
        category: "Bebidas",
        name: "Vino Tinto de la Casa",
        description: "Copa de tinto Malbec, cuerpo medio.",
        priceCents: 4200,
        image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=70",
        ingredients: ["Malbec"],
      },
      {
        category: "Entradas",
        name: "Provoleta",
        description: "Provoleta a la parrilla con orégano y chimichurri.",
        priceCents: 6500,
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=70",
        ingredients: ["Provolone", "Orégano"],
        addons: [
          { name: "Chimichurri extra", priceCents: 300 },
          { name: "Pan de campo", priceCents: 800 },
        ],
      },
      {
        category: "Entradas",
        name: "Empanadas de Carne (x3)",
        description: "Empanadas criollas al horno con masa casera.",
        priceCents: 5400,
        image: "https://images.unsplash.com/photo-1565302129888-6f0a8c7b5632?auto=format&fit=crop&w=800&q=70",
        ingredients: ["Carne", "Cebolla", "Huevo", "Aceituna"],
      },
      {
        category: "Parrilla",
        name: "Bife de Chorizo",
        description: "Bife de chorizo jugoso con chimichurri.",
        priceCents: 14500,
        image: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=70",
        ingredients: ["Bife de chorizo", "Sal parrillera"],
        addons: [
          { name: "Huevo frito", priceCents: 700 },
          { name: "Papas fritas", priceCents: 2500 },
          { name: "Ensalada verde", priceCents: 2200 },
        ],
      },
      {
        category: "Parrilla",
        name: "Asado de Tira",
        description: "Tira de asado a punto, el clásico de la casa.",
        priceCents: 13200,
        image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=70",
        ingredients: ["Asado de tira", "Sal parrillera"],
        addons: [
          { name: "Papas fritas", priceCents: 2500 },
          { name: "Provoleta", priceCents: 6500 },
        ],
      },
      {
        category: "Parrilla",
        name: "Matambre a la Pizza",
        description: "Matambre tierno con salsa, muzzarella y aceitunas.",
        priceCents: 9800,
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=70",
        ingredients: ["Matambre", "Muzzarella", "Salsa de tomate", "Aceituna"],
      },
      {
        category: "Guarniciones",
        name: "Papas Fritas",
        description: "Papas fritas crocantes, porción generosa.",
        priceCents: 2500,
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=70",
        ingredients: ["Papas", "Sal"],
        addons: [
          { name: "Cheddar fundido", priceCents: 900 },
          { name: "Bacon crocante", priceCents: 1100 },
        ],
      },
      {
        category: "Postres",
        name: "Flan con Dulce de Leche",
        description: "Flan casero con dulce de leche y crema.",
        priceCents: 3900,
        image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=70",
        ingredients: ["Flan", "Dulce de leche", "Crema"],
      },
    ],
    tables: 8,
  },
  {
    name: "Café Aurora",
    slug: "cafe-aurora",
    emailDomain: "cafeaurora.com",
    staff: [
      { local: "admin", name: "Sofía Benítez", role: "ADMIN", rate: 1300, password: "admin123", days: [0, 1, 2, 3, 4, 5], start: "08:00", end: "16:00" },
      { local: "cajero", name: "Mateo Ríos", role: "CASHIER", rate: 980, password: "cajero123", days: [1, 2, 3, 4, 5], start: "08:30", end: "16:30" },
      { local: "cocinero", name: "Camila Sosa", role: "COOK", rate: 1150, password: "cocinero123", days: [1, 2, 3, 4, 5, 6], start: "09:00", end: "18:00" },
      { local: "mesero", name: "Nico Aguirre", role: "WAITER", rate: 920, password: "mesero123", days: [1, 2, 3, 4, 5, 6], start: "09:30", end: "18:30" },
      { local: "cocinero2", name: "Agustín Vera", role: "COOK", rate: 1100, password: "cocinero123", days: [2, 3, 4, 5, 6, 0], start: "10:00", end: "19:00" },
    ],
    categories: ["Bebidas", "Desayunos", "Sándwiches", "Postres"],
    products: [
      {
        category: "Bebidas",
        name: "Cappuccino",
        description: "Espresso con leche cremosa y cacao.",
        priceCents: 3200,
        image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=70",
        ingredients: ["Espresso", "Leche", "Cacao"],
        addons: [
          { name: "Leche de almendras", priceCents: 500 },
          { name: "Shot extra", priceCents: 600 },
        ],
      },
      {
        category: "Bebidas",
        name: "Limonada de Frutos Rojos",
        description: "Limonada con frutos rojos, menta y hielo.",
        priceCents: 3400,
        image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=800&q=70",
        ingredients: ["Limón", "Frutos rojos", "Menta"],
      },
      {
        category: "Desayunos",
        name: "Medialunas (x3)",
        description: "Medialunas de manteca recién horneadas.",
        priceCents: 2400,
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=70",
        ingredients: ["Harina", "Manteca"],
      },
      {
        category: "Desayunos",
        name: "Tostadas con Palta",
        description: "Pan de masa madre con palta, tomate y escamas de sal.",
        priceCents: 5800,
        image: "https://images.unsplash.com/photo-1588137378633-dea1336ce1e1?auto=format&fit=crop&w=800&q=70",
        ingredients: ["Pan de masa madre", "Palta", "Tomate", "Sal"],
        addons: [
          { name: "Huevo poché", priceCents: 800 },
          { name: "Rúcula", priceCents: 400 },
        ],
      },
      {
        category: "Desayunos",
        name: "Yogurt con Granola",
        description: "Yogurt natural con granola casera y frutas de estación.",
        priceCents: 4600,
        image: "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=800&q=70",
        ingredients: ["Yogurt", "Granola", "Frutas"],
      },
      {
        category: "Sándwiches",
        name: "Tostado Completo",
        description: "Jamón, queso y tomate en pan de molde tostado.",
        priceCents: 4200,
        image: "https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=800&q=70",
        ingredients: ["Pan", "Jamón", "Queso", "Tomate"],
        addons: [
          { name: "Palta", priceCents: 700 },
          { name: "Huevo", priceCents: 500 },
        ],
      },
      {
        category: "Sándwiches",
        name: "Bagel de Salmón",
        description: "Bagel con salmón ahumado, queso crema y eneldo.",
        priceCents: 9200,
        image: "https://images.unsplash.com/photo-1550514589-1c4e5f0f6b1b?auto=format&fit=crop&w=800&q=70",
        ingredients: ["Bagel", "Salmón", "Queso crema", "Eneldo"],
      },
      {
        category: "Postres",
        name: "Brownie con Helado",
        description: "Brownie tibio con helado de crema americana.",
        priceCents: 5200,
        image: "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?auto=format&fit=crop&w=800&q=70",
        ingredients: ["Chocolate", "Helado"],
        addons: [
          { name: "Dulce de leche", priceCents: 400 },
          { name: "Nueces", priceCents: 500 },
        ],
      },
    ],
    tables: 6,
  },
];

async function main() {
  // 1) Borrar toda la data existente (respetando las relaciones)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.addon.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();
  await prisma.user.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.tenant.deleteMany();

  // 2) Hashear contraseñas una sola vez
  const passwords = new Set<string>();
  for (const rest of RESTAURANTS) for (const s of rest.staff) passwords.add(s.password);
  const hashed: Record<string, string> = {};
  for (const pwd of passwords) hashed[pwd] = await bcrypt.hash(pwd, 10);

  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  for (const rest of RESTAURANTS) {
    // 3) Restaurante + suscripción
    const tenant = await prisma.tenant.create({
      data: { name: rest.name, slug: rest.slug },
    });
    await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        plan: "SCALE",
        billingCycle: "monthly",
        status: "active",
        currentPeriodEnd: periodEnd,
      },
    });

    // 4) Usuarios + perfiles de empleado
    for (const s of rest.staff) {
      const email = `${s.local}@${rest.emailDomain}`;
      const user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          name: s.name,
          email,
          passwordHash: hashed[s.password],
          role: s.role,
        },
      });
      await prisma.employee.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          name: s.name,
          email,
          role: s.role,
          hourlyRateCents: s.rate,
          schedule: JSON.stringify(
            s.days.map((day) => ({ day, start: s.start, end: s.end })),
          ),
          isActive: true,
          startDate: new Date(),
        },
      });
    }

    // 5) Categorías
    const categoryId: Record<string, string> = {};
    for (let i = 0; i < rest.categories.length; i++) {
      const cat = await prisma.category.create({
        data: {
          tenantId: tenant.id,
          name: rest.categories[i],
          sortOrder: i + 1,
        },
      });
      categoryId[cat.name] = cat.id;
    }

    // 6) Productos con ingredientes y adicionales
    for (const p of rest.products) {
      await prisma.product.create({
        data: {
          tenantId: tenant.id,
          categoryId: categoryId[p.category],
          name: p.name,
          description: p.description,
          priceCents: p.priceCents,
          image: p.image,
          ingredients: {
            create: p.ingredients.map((name, i) => ({
              tenantId: tenant.id,
              name,
              sortOrder: i,
            })),
          },
          addons: {
            create: (p.addons ?? []).map((a) => ({
              tenantId: tenant.id,
              name: a.name,
              priceCents: a.priceCents,
              isActive: true,
            })),
          },
        },
      });
    }

    // 7) Mesas
    for (let i = 1; i <= rest.tables; i++) {
      await prisma.table.create({
        data: { tenantId: tenant.id, number: i, name: `Mesa ${i}` },
      });
    }

    console.log(`✔ ${rest.name} (${rest.slug}) creado con ${rest.staff.length} empleados, ${rest.products.length} productos y ${rest.tables} mesas.`);
  }

  console.log("\nSeed completado. Accesos de prueba (la contraseña es igual para ambos restaurantes por rol):");
  console.log("  admin123   -> admin@laparra.com / admin@cafeaurora.com");
  console.log("  cajero123  -> cajero@laparra.com / cajero@cafeaurora.com");
  console.log("  cocinero123-> cocinero@laparra.com / cocinero@cafeaurora.com / cocinero2@cafeaurora.com");
  console.log("  mesero123  -> mesero@laparra.com / mesero2@laparra.com / mesero@cafeaurora.com");
  console.log("Catálogos públicos: /c/la-parra y /c/cafe-aurora");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
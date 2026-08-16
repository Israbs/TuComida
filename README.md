# TuComida

SaaS B2B para restaurantes, cafeterías y heladerías. Multi-tenant, tiempo real, modular.

## Stack

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| Next.js (App Router) | 16.2.9 | Framework full-stack (SSR, RSC, routing) |
| TypeScript | 5.x | Tipado estático |
| Tailwind CSS | 4.x | Estilos utilitarios |
| shadcn/ui | 4.x | Componentes de UI (dialog, table, select, button, etc.) |
| @base-ui/react | 1.6.0 | Base accesible de shadcn/ui (Radix alternativo) |
| tRPC React | 11.13.0 | Cliente type-safe para llamadas al servidor |
| React Query | 5.x | Cache y estado de servidor |
| Sonner | 2.x | Notificaciones toast |
| Socket.IO Client | 4.8.3 | Tiempo real desde el navegador (KDS/POS) |
| next-themes | 0.4.x | Modo oscuro/claro |

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| Next.js API (Route Handlers) | 16.2.9 | Endpoints REST nativos |
| tRPC Server | 11.13.0 | API type-safe con validación Zod |
| Auth.js (next-auth) | 5.0.0-beta.31 | Autenticación JWT + Credentials |
| Prisma ORM | 7.8.0 | ORM type-safe con migraciones |
| Prisma Adapter (better-sqlite3) | 7.8.0 | Conexión a SQLite |
| Socket.IO Server | 4.8.3 | WebSockets para tiempo real |
| bcryptjs | 3.x | Hash de contraseñas |
| Zod | 4.x | Validación de esquemas |

### Base de datos
| Tecnología | Entorno |
|---|---|
| SQLite (better-sqlite3) | Desarrollo local |
| PostgreSQL | Producción (vía docker-compose.yml) |

## Requisitos

- Node.js 20+
- npm

## Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Sincronizar DB y cargar datos demo
npx prisma db push
npm run db:seed

# Iniciar servidor de desarrollo (HTTP + Socket.IO en un solo proceso)
npm run dev
```

Abrir `http://localhost:3000`

> ⚠️ Si tenías un `next dev` anterior corriendo, deténlo primero
> (`taskkill /PID <pid> /F`) — el proyecto ahora usa un custom server
> (`server.ts`) que levanta Next.js + Socket.IO en el mismo proceso.

## Usuarios de prueba

El seed crea dos restaurantes demo (**La Parra** y **Café Aurora**), cada uno con su
equipo. Los emails usan el dominio del local (`@laparra.com`, `@cafeaurora.com`).

| Email | Contraseña | Rol |
|---|---|---|
| admin@laparra.com | admin123 | ADMIN |
| cajero@laparra.com | cajero123 | CASHIER |
| cocinero@laparra.com | cocinero123 | COOK |
| mesero@laparra.com | mesero123 | WAITER |

> Para **Café Aurora** cambiá el dominio: `admin@cafeaurora.com`, `cajero@cafeaurora.com`, etc.

## Estructura del proyecto

```
tucomida/
├── prisma/
│   ├── schema.prisma          # Modelos de base de datos (Tenant, User, Product,
│   │                          #   Order, OrderItem, Category, Ingredient, Addon,
│   │                          #   Table, Employee, Attendance, Subscription)
│   └── seed.ts                # Seed: 2 restaurantes demo (La Parra, Café Aurora)
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── page.tsx           # Landing principal TuComida (/)
│   │   ├── login/page.tsx     # Login (/login)
│   │   ├── register/          # Registro de establecimiento (/register)
│   │   ├── invite/            # Aceptar invitación de RRHH (/invite/[token])
│   │   ├── c/[slug]/page.tsx  # Carta digital pública de cada restaurante (/c/la-parra)
│   │   ├── (dashboard)/       # Grupo de rutas protegidas (por rol)
│   │   │   ├── layout.tsx     # Sidebar + header + auth check + SessionExtender
│   │   │   ├── dashboard/     # Ventas del día, órdenes abiertas, KPIs
│   │   │   ├── mi-jornada/    # Turno de hoy, marcaciones, horas semanales
│   │   │   ├── attendance/    # Marcaciones y código rotatorio
│   │   │   ├── pos/           # Punto de venta (cart.tsx, open-orders.tsx, types.ts)
│   │   │   ├── kds/           # Pantalla de cocina (Nuevas/En preparación/Listas)
│   │   │   ├── inventory/     # CRUD productos, categorías, imagen de producto
│   │   │   ├── hr/            # Personal, turnos, invitaciones por email
│   │   │   ├── tables/        # Mesas (QR por mesa)
│   │   │   └── catalog/       # QR de la carta digital
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── trpc/[trpc]/route.ts
│   │       ├── upload/route.ts          # Subir imagen de producto → /api/uploads/...
│   │       └── uploads/[tenant]/[file]/route.ts  # Servir imágenes (fuera de public/)
│   ├── lib/
│   │   ├── prisma.ts          # Cliente Prisma singleton
│   │   ├── auth.ts            # Auth.js: JWT + Credentials + RBAC + maxAge de sesión
│   │   ├── trpc.ts            # tRPC init + procedimientos (protected/admin/manager)
│   │   ├── access.ts          # Permisos por rol y home por rol
│   │   ├── app-url.ts         # URL base (LAN / localhost)
│   │   ├── mail.ts            # Envío de invitaciones (Resend)
│   │   ├── socket.ts          # Singleton Socket.IO + emitToTenant (server)
│   │   ├── subscription.ts    # Planes y límites
│   │   ├── totp.ts            # Código rotatorio de marcación
│   │   ├── uploads.ts         # Guardado de imágenes (uploads/{tenant}/) + validación
│   │   └── utils.ts           # Helpers (formatPrice, uuid con fallback, cn)
│   ├── trpc/
│   │   ├── router.ts          # Router principal (merge de todos los módulos)
│   │   ├── client.ts          # Cliente tRPC React
│   │   └── routers/
│   │       ├── inventory.ts   # CRUD categorías y productos
│   │       ├── orders.ts      # Crear pedido, cambiar estado, cobrar, pedidos activos
│   │       ├── attendance.ts  # Marcaciones y tablero
│   │       └── hr.ts          # Empleados, turnos, invitaciones
│   ├── components/
│   │   ├── providers.tsx      # Session + TRPC + Theme + Socket
│   │   ├── socket-provider.tsx# Conexión Socket.IO del cliente (auth por sesión)
│   │   ├── session-extender.tsx# Banner para extender la sesión antes de que expire
│   │   ├── dashboard-shell.tsx# Layout del dashboard (sidebar + header)
│   │   ├── confirm-dialog.tsx, sign-out-button.tsx, register-form.tsx, ...
│   │   ├── landing/pricing.tsx# Sección de precios de la landing
│   │   └── ui/                # shadcn/ui (button, dialog, table, select, etc.)
│   ├── hooks/
│   │   └── use-socket-event.ts# Suscribirse a eventos Socket.IO e invalidar queries
│   ├── proxy.ts               # Middleware: protege rutas, valida que el usuario exista
│   └── types/
│       └── next-auth.d.ts     # Tipos extendidos de sesión
├── server.ts                  # Custom server: Next.js + Socket.IO (auth + rooms)
├── uploads/                   # Imágenes subidas por tenants (ignorada por git)
├── docker-compose.yml         # PostgreSQL (producción)
├── prisma.config.ts           # Configuración Prisma 7
└── package.json
```

## Base de datos — Modelos

```
Tenant ──┬── User (ADMIN, CASHIER, COOK, WAITER)
         ├── Category ── Product ──┬── Ingredient
         │                         └── Addon
         ├── Table
         ├── Order ── OrderItem ── Product
         ├── Employee ── User
         ├── Attendance
         └── Subscription

Enums: UserRole, OrderStatus (PENDING|PREPARING|READY|DELIVERED|CANCELLED),
       OrderOrigin (POS|ONLINE|WAITER), SubscriptionPlan (STARTER|GROWTH|SCALE)
```

Todos los modelos multi-tenant tienen `tenantId` y filtran automáticamente por el tenant del usuario autenticado. Los precios se guardan en centavos (`*Cents`, Int).

## Cómo se conecta todo

1. **Proxy** (`src/proxy.ts`) corre primero. Verifica la cookie JWT y, además, valida que el usuario siga existiendo en la base; si no existe, limpia la sesión y redirige a `/login`.
2. **Dashboard layout** (`(dashboard)/layout.tsx`) verifica sesión con `auth()` de Auth.js y filtra el menú por rol.
3. **Páginas interactivas** (`"use client"`) usan hooks de `@trpc/react-query` para llamar al servidor.
4. **tRPC** recibe la petición, el middleware `protectedProcedure` verifica la sesión e inyecta `ctx.user` con `tenantId`. `adminProcedure` restringe mutaciones a rol `ADMIN` y `managerProcedure` a `ADMIN`/`CASHIER`.
5. **Prisma** ejecuta la query filtrada por `tenantId`.
6. **Tiempo real** — las mutaciones emiten eventos con `emitToTenant(tenantId, ...)` a la room `tenant:{id}` de Socket.IO. Los clientes conectados (`SocketProvider` + hook `useSocketEvent`) los reciben al instante e invalidan React Query.
7. **Imágenes** — se suben a `uploads/{tenantId}/` y se sirven por `/api/uploads/{tenant}/{file}` (fuera de `public/`, porque `next start` no sirve archivos agregados a `public/` en runtime).

## Tiempo real (Socket.IO)

La app corre con un **custom server** (`server.ts`) que levanta Next.js y Socket.IO en el mismo proceso (un solo puerto, latencia mínima).

- Cada sesión se autentica en el handshake decodificando el JWE de Auth.js (`decode` de `next-auth/jwt` con el `salt` = nombre de la cookie).
- Cada socket entra a la room **`tenant:{id}`**, aislando por completo los datos entre clientes.
- Patrón para pedidos: mutación tRPC escribe en DB → `emitToTenant` → los clientes del mismo tenant (KDS, meseros, POS) reciben el evento y refrescan la UI en <100ms.
- En producción con varios servidores se añade el adapter de Redis (`@socket.io/redis-adapter`) y se usa PostgreSQL.

## Estado del proyecto

### Implementado ✅

| Módulo | Funcionalidad |
|---|---|
| Autenticación | Login con email/contraseña, JWT, 4 roles, sesión deslizante con extensión |
| RBAC | `adminProcedure` (ADMIN) y `managerProcedure` (ADMIN/CASHIER) |
| Multi-tenant | Aislamiento por tenantId + rooms de Socket.IO por tenant |
| Proxy/Middleware | Protección de rutas + validación de usuario existente en DB |
| Dashboard | Ventas/órdenes de hoy, órdenes abiertas, productos activos |
| Inventario | CRUD productos + categorías, ingredientes, adicionales y foto de producto |
| POS | Carrito, personalización (ingredientes/adicionales), mesas, envío a cocina y cobro |
| KDS | Comandas en vivo (Nuevas → En preparación → Listas → Entregado) por Socket.IO |
| Mesas | Gestión de mesas y QR por mesa |
| RRHH | Empleados, roles, salarios, turnos semanales e invitaciones por email |
| Asistencias | Marcación con código rotatorio y tablero en vivo |
| Mi Jornada | Turno de hoy, marcaciones y horas acumuladas |
| Catálogo público | Carta digital por restaurante en `/c/[slug]` |
| Tiempo real | Custom server `server.ts` (Next + Socket.IO), auth JWE en handshake |
| Imágenes | Upload y servido de imágenes de producto por `/api/uploads/...` |
| API | tRPC v11 con routers por módulo (inventory, orders, attendance, hr) |
| UI | shadcn/ui + Tailwind 4, tema claro/oscuro, toasts Sonner |

### Por implementar 🚧

| Módulo | Prioridad | Dependencias |
|---|---|---|
| **Web por restaurante** (landing + pedido online) | Alta | Catálogo público, POS |
| **Pedidos online** (app de pedir en línea por restaurante) | Alta | Web por restaurante |
| **Suscripciones / Facturación** | Media | — |
| **Migración a PostgreSQL** | Media | Docker |
| **Adapter Redis para Socket.IO** | Baja | Multi-servidor |

## Comandos disponibles

```bash
npm run dev           # Servidor de desarrollo (Next + Socket.IO, tsx server.ts)
npm run dev:network   # Dev accesible desde la red local (HOSTNAME=0.0.0.0)
npm run build         # Build de producción
npm run build:prod    # Alias de next build
npm run start         # Servidor de producción (tsx server.ts)
npm run start:network # Producción accesible desde la red (0.0.0.0)
npm run lint          # ESLint
npm run db:generate   # Generar Prisma Client
npm run db:seed       # Poblar DB con datos demo
```

## Cómo subir y traer el proyecto a GitHub

Ver la guía completa en [`GITHUB.md`](./GITHUB.md). Resumen:

```bash
git pull origin main   # traer cambios (hacer antes de pushear si hay más gente)
git add -A             # marcar cambios
git commit -m "feat: lo que hice"
git push origin main   # subir a GitHub
```

> El archivo `.env` no se sube (está en `.gitignore`). Después de clonar,
> copiá `.env.example` a `.env` y completá los valores reales.

## Cómo agregar un nuevo módulo

1. Agregar modelo en `prisma/schema.prisma` y correr `npm run db:generate`
2. Crear router tRPC en `src/trpc/routers/`
3. Importar y mergear en `src/trpc/router.ts`
4. Crear página en `src/app/(dashboard)/[modulo]/page.tsx`
5. Agregar ruta a los `allSections` en `(dashboard)/layout.tsx` y, si hace falta,
   definir permisos por rol en `src/lib/access.ts`
6. Si el módulo emite eventos en tiempo real, usar `emitToTenant` (server)
   y `useSocketEvent` (cliente)

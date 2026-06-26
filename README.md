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
npx tsx node_modules/prisma/build/index.js db push
npx tsx prisma/seed.ts

# Iniciar servidor de desarrollo
npm run dev
```

Abrir `http://localhost:3000`

## Usuarios de prueba

| Email | Contraseña | Rol |
|---|---|---|
| admin@demo.com | admin123 | ADMIN |
| cajero@demo.com | cajero123 | CASHIER |
| cocinero@demo.com | cocinero123 | COOK |
| mesero@demo.com | mesero123 | WAITER |

## Estructura del proyecto

```
tucomida/
├── prisma/
│   ├── schema.prisma          # Modelos de base de datos
│   └── seed.ts                # Datos de prueba
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── page.tsx           # Landing page (/)
│   │   ├── login/page.tsx     # Login (/login)
│   │   ├── (dashboard)/       # Grupo de rutas protegidas
│   │   │   ├── layout.tsx     # Sidebar + header + auth check
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx   # Panel principal /dashboard
│   │   │   ├── inventory/
│   │   │   │   └── page.tsx   # CRUD productos y categorías
│   │   │   ├── pos/page.tsx   # Placeholder
│   │   │   ├── kds/page.tsx   # Placeholder
│   │   │   ├── hr/page.tsx    # Placeholder
│   │   │   └── tables/page.tsx# Placeholder
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       └── trpc/[trpc]/route.ts
│   ├── lib/
│   │   ├── prisma.ts          # Cliente Prisma singleton
│   │   ├── auth.ts            # Auth.js: JWT + Credentials + RBAC
│   │   ├── trpc.ts            # tRPC init + middleware auth
│   │   └── tenant.ts          # Helpers multi-tenant
│   ├── trpc/
│   │   ├── router.ts          # Router principal
│   │   ├── client.ts          # Cliente tRPC React
│   │   └── routers/
│   │       └── inventory.ts   # CRUD categorías y productos
│   ├── components/
│   │   ├── providers.tsx      # SessionProvider + TRPCProvider + Theme
│   │   └── ui/                # shadcn/ui (button, dialog, table, select,
│   │                          #   input, textarea, badge, card, sonner, etc.)
│   ├── proxy.ts               # Edge middleware (protección de rutas)
│   └── types/
│       └── next-auth.d.ts     # Tipos extendidos de sesión
├── docker-compose.yml         # PostgreSQL (producción)
├── prisma.config.ts           # Configuración Prisma 7
└── package.json
```

## Base de datos — Modelos

```
Tenant ──┬── User (ADMIN, CASHIER, COOK, WAITER)
         ├── Category ── Product
         ├── Table
         ├── Order ── OrderItem ── Product
         └── Shift ── User

Enums: UserRole, OrderStatus (PENDING|PREPARING|READY|DELIVERED|CANCELLED),
       OrderOrigin (POS|ONLINE|WAITER)
```

Todos los modelos multi-tenant tienen `tenantId` y filtran automáticamente por el tenant del usuario autenticado.

## Cómo se conecta todo

1. **Proxy** (`src/proxy.ts`) corre primero. Verifica cookie JWT. Si no hay, redirige a `/login`.
2. **Dashboard layout** (`(dashboard)/layout.tsx`) verifica sesión con `auth()` de Auth.js.
3. **Páginas interactivas** (`"use client"`) usan hooks de `@trpc/react-query` para llamar al servidor.
4. **tRPC** recibe la petición, el middleware `protectedProcedure` verifica la sesión e inyecta `ctx.user` con `tenantId`.
5. **Prisma** ejecuta la query filtrada por `tenantId`.

## Estado del proyecto

### Implementado ✅

| Módulo | Funcionalidad |
|---|---|
| Autenticación | Login con email/contraseña, JWT, 4 roles |
| Multi-tenant | Aislamiento de datos por tenantId |
| Proxy/Middleware | Protección de rutas del dashboard |
| Dashboard | Layout con sidebar, cards de estadísticas |
| Inventario | CRUD productos + categorías con modales y validación |
| API | tRPC v11 con router organizado y procedimientos protegidos |
| UI | Componentes shadcn/ui (tabla, diálogo, select, toasts, etc.) |
| Base de datos | Schema completo con 8 modelos, seed con datos demo |

### Por implementar 🚧

| Módulo | Prioridad | Dependencias |
|---|---|---|
| **POS** (Punto de Venta) | Alta | Inventario (listo) |
| **KDS** (Pantalla de Cocina) | Alta | POS, Socket.IO |
| **Gestión de Mesas** | Alta | POS |
| **RRHH** (Turnos/Personal) | Media | — |
| **Pedidos Online** | Baja | POS, Catálogo público |
| **Catálogo Público** | Baja | Inventario |
| **Landing page personalizable** | Baja | — |
| **Suscripciones / Facturación** | Baja | — |
| **Migración a PostgreSQL** | Media | Docker |

## Comandos disponibles

```bash
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Build de producción + type check
npm run start        # Iniciar servidor de producción
npm run lint         # ESLint
npm run db:generate  # Generar Prisma Client
npm run db:seed      # Poblar DB con datos demo
```

## Cómo agregar un nuevo módulo

Ver documentación en [`plan.txt`](./plan.txt) o seguir:

1. Agregar modelo en `prisma/schema.prisma`
2. `npx tsx node_modules/prisma/build/index.js db push`
3. Crear router tRPC en `src/trpc/routers/`
4. Importar y mergear en `src/trpc/router.ts`
5. Crear página en `src/app/(dashboard)/[modulo]/page.tsx`
6. Agregar ruta a `protectedRoutes` en `src/proxy.ts`
7. Agregar link al sidebar en `(dashboard)/layout.tsx`

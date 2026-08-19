import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChefHat,
  Fingerprint,
  LayoutDashboard,
  Mail,
  MonitorSmartphone,
  Package,
  QrCode,
  Users,
} from "lucide-react";
import { PricingSection } from "@/components/landing/pricing";

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Dashboard de ventas",
    description:
      "Ventas del día, órdenes abiertas y rendimiento de tu local en tiempo real.",
  },
  {
    icon: MonitorSmartphone,
    title: "Punto de venta (POS)",
    description:
      "Tomá pedidos, manejá la caja y agilizá cada comanda desde una pantalla clara.",
  },
  {
    icon: ChefHat,
    title: "Pantalla de cocina (KDS)",
    description:
      "Las comandas llegan directo a cocina. Sin papel, sin gritos, sin perder órdenes.",
  },
  {
    icon: Package,
    title: "Inventario y carta",
    description:
      "Productos, categorías, ingredientes y extras. Tu carta digital siempre al día.",
  },
  {
    icon: Users,
    title: "RRHH: equipo y turnos",
    description:
      "Perfiles, salarios, horarios e invitaciones por correo para armar tu equipo.",
  },
  {
    icon: Fingerprint,
    title: "Asistencias sin trampa",
    description:
      "Marcación con código rotatorio que cambia cada 30 segundos: nadie se marca desde casa.",
  },
  {
    icon: QrCode,
    title: "Mesas y QR",
    description:
      "Asigná mesas y prepará el camino para que tus clientes pidan con su celular.",
  },
  {
    icon: Mail,
    title: "Invitaciones por correo",
    description:
      "Creá usuarios para tu equipo y que cada persona llegue lista a trabajar.",
  },
];

const SYSTEMS = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    steps: [
      "Ingresás con tu usuario admin y ves el resumen del día.",
      "Ventas, órdenes, órdenes abiertas y productos activos, al instante.",
      "Cada pedido actualiza las cifras en vivo, sin recargar la página.",
    ],
  },
  {
    icon: MonitorSmartphone,
    title: "Punto de venta (POS)",
    steps: [
      "El cajero abre el POS y arma el pedido.",
      "Agrega productos con cantidades y extras desde tu carta.",
      "Confirma la comanda y la cocina la recibe al instante.",
      "Al cobrar, la venta queda registrada en el dashboard.",
    ],
  },
  {
    icon: ChefHat,
    title: "Pantalla de cocina (KDS)",
    steps: [
      "Cada comanda aparece sola en la pantalla de cocina.",
      "El cocinero la marca como \"en preparación\".",
      "Cuando sale, la pasa a \"lista\" y el cajero la entrega.",
    ],
  },
  {
    icon: Package,
    title: "Inventario y carta",
    steps: [
      "Creás categorías: entradas, platos, postres, bebidas.",
      "Agregás cada producto con foto, precio y descripción.",
      "Definís ingredientes y extras opcionales.",
      "Queda todo listo para usar en el POS y el KDS.",
    ],
  },
  {
    icon: Users,
    title: "RRHH: equipo y turnos",
    steps: [
      "Invitas a tu equipo por correo y se crea su usuario.",
      "Cargás rol, salario por hora, foto y documento.",
      "Definís el turno de cada día de la semana.",
      "Cada persona entra a su área con su rol.",
    ],
  },
  {
    icon: Fingerprint,
    title: "Asistencias",
    steps: [
      "Una pantalla en el local muestra un código que cambia cada 30 segundos.",
      "El empleado lo escribe para marcar entrada y salida.",
      "Así nadie puede marcarse desde su casa.",
      "El admin ve el tablero en vivo: quién está, quién llegó tarde, quién falta.",
      "Cualquier corrección queda auditada.",
    ],
  },
  {
    icon: QrCode,
    title: "Mesas y QR",
    steps: [
      "Creás las mesas de tu salón.",
      "Cada mesa queda lista para recibir pedidos.",
      "Preparado para que tus clientes pidan desde su celular.",
    ],
  },
  {
    icon: Mail,
    title: "Invitaciones",
    steps: [
      "Cada invitación llega por correo con un link único.",
      "El empleado crea su contraseña.",
      "Queda listo para trabajar con su rol asignado.",
    ],
  },
];

const STEPS = [
  {
    number: "01",
    title: "Creá tu restaurante",
    description: "Tu nombre, tu email y listo. Se arma tu tenant con todo habilitado.",
  },
  {
    number: "02",
    title: "Armá tu carta",
    description: "Categorías, productos, fotos y precios. Tu inventario al día.",
  },
  {
    number: "03",
    title: "Sumá a tu equipo",
    description:
      "Invitá a cajeros, cocineros y meseros. Cada rol ve solo lo que necesita.",
  },
];

const PHOTOS = {
  hero: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2000&q=70",
  kitchen:
    "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1600&q=70",
  cta: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=70",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-[#0d0b09]/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-white">
            TuComida
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-white/70 md:flex">
            <Link href="#caracteristicas" className="hover:text-white">
              Características
            </Link>
            <Link href="#sistemas" className="hover:text-white">
              Sistemas
            </Link>
            <Link href="#como-funciona" className="hover:text-white">
              Cómo funciona
            </Link>
            <Link href="#suscripcion" className="hover:text-white">
              Suscripción
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:text-white sm:block"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              Comenzar gratis
            </Link>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-[#0d0b09]">
        <Image
          src={PHOTOS.hero}
          alt="Interior cálido de un restaurante"
          fill
          sizes="100vw"
          priority
          className="absolute inset-0 -z-20 object-cover opacity-70"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/55 to-black/85" />

        <div className="mx-auto max-w-6xl px-4 pt-20 pb-16 text-center sm:pt-28">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Diseñado para restaurantes, cafés y heladerías
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl">
            Tu Restaurante,{" "}
            <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
              en una Sola Pantalla
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/70">
            Punto de venta, cocina, inventario, RRHH y asistencias sin trampa.
            Todo lo que tu equipo necesita, simple y elegante.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-7 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80 sm:w-auto"
            >
              Comenzar gratis
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="#sistemas"
              className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-white/25 bg-white/5 px-7 text-sm font-semibold text-white backdrop-blur hover:bg-white/10 sm:w-auto"
            >
              Ver los sistemas
            </Link>
          </div>
          <p className="mt-4 text-xs text-white/50">
            Sin tarjeta de crédito · Pago simulado · Cancelá cuando quieras
          </p>
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 pb-10">
          <div className="rounded-3xl border border-white/10 bg-black/45 p-2 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur">
            <div className="flex items-center gap-1.5 rounded-2xl bg-white/5 px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-red-400/80" />
              <span className="size-2.5 rounded-full bg-amber-400" />
              <span className="size-2.5 rounded-full bg-emerald-400" />
              <span className="ml-3 h-4 flex-1 max-w-40 rounded bg-white/10" />
              <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                En vivo
              </span>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-4">
              {[
                { label: "Ventas hoy", value: "$1.240", up: "+12%" },
                { label: "Órdenes", value: "84", up: "+8%" },
                { label: "En el local", value: "6", up: "3 turnos" },
                { label: "Tiempo medio", value: "11m", up: "-2m" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-white/50">{s.label}</p>
                  <p className="mt-1 text-2xl font-extrabold tracking-tight text-white">
                    {s.value}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-emerald-400">{s.up}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="caracteristicas" className="scroll-mt-20 pt-16">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Características
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Todo tu operación, sin fricción
            </h2>
            <p className="mt-3 text-muted-foreground">
              Cada módulo pensado para que tu equipo trabaje más rápido y vos
              tengas el control total.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-3xl">
            <div className="relative h-72 sm:h-96">
              <Image
                src={PHOTOS.kitchen}
                alt="Cocinero trabajando en una cocina profesional"
                fill
                sizes="(min-width: 1280px) 1216px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">
                  Pantalla de cocina (KDS)
                </p>
                <p className="mt-2 max-w-xl text-2xl font-extrabold text-white sm:text-3xl">
                  La comanda llega sola a cocina. Sin papel, sin gritos.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="sistemas" className="scroll-mt-20 bg-[#0d0b09] py-20 text-white sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-300">
              Cómo funciona cada sistema
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Paso a paso, sin misterio
            </h2>
            <p className="mt-3 text-white/60">
              Cada módulo explicado como lo usa tu equipo todos los días.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {SYSTEMS.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-white/20"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-amber-300">
                    <s.icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-bold">{s.title}</h3>
                </div>
                <ol className="mt-4 space-y-2.5">
                  {s.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-amber-300">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-20 border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Cómo funciona
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              De cero a operando en minutos
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.number} className="relative rounded-2xl border bg-card p-7">
                <span className="text-5xl font-extrabold text-primary/20">{s.number}</span>
                <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PricingSection />

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="relative isolate overflow-hidden rounded-3xl bg-[#0d0b09]">
          <Image
            src={PHOTOS.cta}
            alt="Mesas de un restaurante iluminadas al anochecer"
            fill
            sizes="(min-width: 1280px) 1216px, 100vw"
            className="-z-20 object-cover opacity-50"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 to-black/50" />
          <div className="px-6 py-16 text-center sm:px-12">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Tu local merece operar sin caos
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/70">
              Creá tu restaurante hoy. Sumá tu carta, tu equipo y tu caja antes de
              que llegue el primer cliente.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-7 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
            >
              Comenzar gratis
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t bg-[#0d0b09]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <p className="text-sm font-bold text-white">TuComida</p>
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} TuComida. Todos los derechos reservados.
          </p>
          <nav className="flex items-center gap-4 text-xs text-white/50">
            <Link href="/login" className="hover:text-white">
              Iniciar sesión
            </Link>
            <Link href="#suscripcion" className="hover:text-white">
              Suscripción
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
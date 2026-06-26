import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <h1 className="text-2xl font-bold">TuComida</h1>
        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/90"
          >
            Registrarse
          </Link>
        </nav>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h2 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Gestiona tu restaurante con TuComida
        </h2>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Punto de venta, cocina, inventario y más en un solo lugar.
          Transforma digitalmente tu negocio.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-8 text-sm font-medium text-background hover:bg-foreground/90"
          >
            Comenzar ahora
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium hover:bg-accent"
          >
            Más información
          </Link>
        </div>
      </section>

      <footer className="border-t px-6 py-4 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} TuComida. Todos los derechos reservados.
      </footer>
    </div>
  );
}

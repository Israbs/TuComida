import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#EEEEEE]">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 flex h-16 md:h-20 items-center justify-between px-4 sm:px-8 md:px-20 lg:px-40 text-white bg-transparent">
        <div className="relative h-8 w-32 sm:h-10 sm:w-40 md:h-12 md:w-48">
          <Image 
            src="/logo-horizontal.png" 
            alt="Logo TuComida" 
            fill
            sizes="(max-width: 768px) 150px, 200px"
            className="object-contain object-left"
            priority
          />
        </div>

        <nav className="flex items-center gap-2 sm:gap-4 text-sm sm:text-base md:text-[20px]">
          <Link
            href="/login"
            className="font-semibold text-white transition-colors hover:text-white/80 whitespace-nowrap"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/login"
            className="inline-flex h-8 sm:h-9 items-center justify-center rounded-md bg-brand-surface/95 px-3 sm:px-4 font-semibold text-white transition-colors hover:text-white/80 whitespace-nowrap"
          >
            Registrarse
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative flex flex-1 flex-col items-center justify-center px-4 sm:px-6 pt-24 pb-16 md:py-40 text-center overflow-hidden">
  
        {/* Imagen de fondo */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/restaurant-banner.png"
            alt="Fondo Restaurante"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        {/* Capa Oscura */}
        <div className="absolute inset-0 bg-black/40 z-0"/>

        {/* Contenido */}
        <div className="relative z-10 flex max-w-3xl flex-col items-center rounded-2xl border border-white/10 bg-black/40 p-8 text-gray-200 backdrop-blur-md sm:p-12">
          <h2 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Gestiona tu restaurante con TuComida
          </h2>
          <p className="mt-4 max-w-xl text-lg text-gray-200">
            Punto de venta, cocina, inventario y más en un solo lugar.
            Transforma digitalmente tu negocio.
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-md bg-white px-8 font-semibold text-black hover:bg-white/90"
            >
              Comenzar ahora
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-md border border-white bg-transparent px-8 font-semibold text-white hover:bg-white/10"
            >
              Más información
            </Link>
          </div>
        </div>

      </section>
        
      {/* Seccion: Sobre Nosotros */}
      <section className="relative bg-[#EEEEEE] px-6 py-12 md:px-40 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-black text-sm font-bold tracking-widest uppercase">Conócenos más</span>
            <h2 className="text-4xl font-extrabold tracking-tight mt-2 text-black">
              El Ingrediente Secreto de tu Éxito
            </h2>
            <div className="h-1 w-20 bg-brand-surface mx-auto mt-4 rounded"></div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1: Proposito */}
            <div className="flex flex-col bg-brand-surface/95 p-8 rounded-2xl border border-white/10 shadow-xl transition-all hover:border-brand-accent/40">
              <h3 className="text-3xl font-bold text-[#FFB400] mb-3">Nuestra Misión</h3>
              <p className="text-gray-200 text-[18px] leading-relaxed">
                En TuComida, creemos que la tecnología no debe ser un obstáculo, sino el ingrediente secreto que impulsa la eficiencia de tu negocio. Nacimos para simplificar la gestión de restaurantes para que puedas crear platos inolvidables y brindar experiencias excepcionales.
              </p>
            </div>

            {/* Card 2: Vision */}
            <div className="flex flex-col bg-brand-surface/95 p-8 rounded-2xl border border-white/10 shadow-xl transition-all hover:border-brand-accent/40">
              <h3 className="text-3xl font-bold text-[#418acf] mb-3">Nuestra Visión</h3>
              <p className="text-gray-200 text-[18px] leading-relaxed">
                Queremos transformar el panorama digital de la gastronomía, eliminando la complejidad técnica para que cualquier restaurante, sin importar su tamaño, pueda contar con herramientas de gestión de clase mundial y competir al más alto nivel.
              </p>
            </div>

            {/* Card 3: Por que elegimos este camino */}
            <div className="flex flex-col bg-brand-surface/95 p-8 rounded-2xl border border-white/10 shadow-xl transition-all hover:border-brand-accent/40">
              <h3 className="text-3xl font-bold text-[#53cfa0] mb-3">Por Qué Este Camino</h3>
              <p className="text-gray-200 text-[18px] leading-relaxed">
                Sabemos que dirigir un restaurante es un desafío constante. Entre el control de inventarios, la gestión de pedidos y la atención al cliente, los procesos manuales suelen consumir el tiempo y la energía que tu negocio necesita para crecer.
              </p>
            </div>
          </div>

        </div>
      </section>

      <footer className="border-t px-6 py-6 text-center text-gray-200 bg-brand-surface/95">
        &copy; {new Date().getFullYear()} TuComida. Todos los derechos reservados.
      </footer>
    </div>
  );
}

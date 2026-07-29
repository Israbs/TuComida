import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#EEEEEE]">
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-40 py-6 text-white bg-transparent text-[20px]">
        <img src="/logo-horizontal.png" alt="Logo TuComida" className=""/>
        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="font-semibold hover:text-white/90"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-md text-white bg-black px-4 font-semibold hover:text-white/90"
          >
            Registrarse
          </Link>
        </nav>
      </header>

      <section className="relative flex flex-1 flex-col items-center justify-center px-6 py-40 text-center overflow-hidden">
  
        {/* Imagen de fondo */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/restaurant-banner.jpg')" }}
        />

        {/* Capa Oscura */}
        <div className="absolute inset-0 bg-black/50"/>

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
        
      {/* Seccon: Sobre Nosotros */}
      <section className="relative bg-[#EEEEEE] px-6 py-12 md:px-40 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-black text-sm font-bold tracking-widest uppercase">Conócenos más</span>
            <h2 className="text-4xl font-extrabold tracking-tight mt-2 text-black">
              El Ingrediente Secreto de tu Éxito
            </h2>
            <div className="h-1 w-20 bg-[#0f0806] mx-auto mt-4 rounded"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1: Proposito */}
            <div className="flex flex-col bg-linear-to-br from-[#332013] via-[#0f0a07] to-[#21140c] p-8 rounded-xl border border-white/5 shadow-md">
              <h3 className="text-3xl font-bold text-[#FFB400] mb-3">Nuestra Misión</h3>
              <p className="text-gray-200 text-[18px] leading-relaxed">
                En TuComida, creemos que la tecnología no debe ser un obstáculo, sino el ingrediente secreto que impulsa la eficiencia de tu negocio. Nacimos para simplificar la gestión de restaurantes para que puedas crear platos inolvidables y brindar experiencias excepcionales.
              </p>
            </div>

            {/* Card 2: Vision */}
            <div className="flex flex-col bg-linear-to-br from-[#332013] via-[#0f0a07] to-[#21140c] p-8 rounded-xl border border-white/5 shadow-md">
              <h3 className="text-3xl font-bold text-[#FF5A5F] mb-3">Nuestra Visión</h3>
              <p className="text-gray-200 text-[18px] leading-relaxed">
                Queremos transformar el panorama digital de la gastronomía, eliminando la complejidad técnica para que cualquier restaurante, sin importar su tamaño, pueda contar con herramientas de gestión de clase mundial y competir al más alto nivel.
              </p>
            </div>

            {/* Card 3: Por que elegimos este camino */}
            <div className="flex flex-col bg-linear-to-br from-[#332013] via-[#0f0a07] to-[#21140c] p-8 rounded-xl border border-white/5 shadow-md">
              <h3 className="text-3xl font-bold text-[#E0E0E0] mb-3">Por Qué Este Camino</h3>
              <p className="text-gray-200 text-[18px] leading-relaxed">
                Sabemos que dirigir un restaurante es un desafío constante. Entre el control de inventarios, la gestión de pedidos y la atención al cliente, los procesos manuales suelen consumir el tiempo y la energía que tu negocio necesita para crecer.
              </p>
            </div>

          </div>
        </div>
      </section>

      <footer className="border-t px-6 py-6 text-center text-gray-200 bg-linear-to-br from-[#332013] via-[#0f0a07] to-[#21140c]">
        &copy; {new Date().getFullYear()} TuComida. Todos los derechos reservados.
      </footer>
    </div>
  );
}

import { 
  TrendingUp, 
  ShoppingBag, 
  Utensils, 
  Grid, 
  ArrowUpRight,
  Clock,
  ChevronRight
} from "lucide-react";

export default async function DashboardPage() {
  return (
    <div className="p-4 space-y-6 bg-[#EEEEEE]">
      <p className="text-black">
        Bienvenido al panel de administración de TuComida.
      </p>

      {/* Metricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-[#47D48F] p-5 text-black shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold opacity-80">Ventas Hoy</span>
            <div className="rounded-full bg-black/10 p-2">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold">$0.00</p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#D18CE8] p-5 text-black shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold opacity-80">Órdenes Hoy</span>
            <div className="rounded-full bg-black/10 p-2">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold">0</p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#7A80F9] p-5 text-black shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold opacity-80">Platillos / Menú</span>
            <div className="rounded-full bg-black/10 p-2">
              <Utensils className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold">0</p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#FB7560] p-5 text-black shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold opacity-80">Estado Mesas</span>
            <div className="rounded-full bg-black/10 p-2">
              <Grid className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold">0 / 0</p>
          </div>
        </div>
      </div>
    </div>
  );
}

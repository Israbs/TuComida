export default async function DashboardPage() {
  return (
    <div className="p-4 space-y-6 bg-[#181818]">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">
        Bienvenido al panel de administración de TuComida.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4 text-black bg-[#47D48F]">
          <h3 className="text-sm font-medium text-muted-foregroung">Ventas Hoy</h3>
          <p className="mt-2 text-3xl font-bold">$0.00</p>
        </div>
        <div className="rounded-lg border p-4 text-black bg-[#D18CE8]">
          <h3 className="text-sm font-medium text-muted-foreground">Órdenes</h3>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-lg border p-4 text-black bg-[#7A80F9]">
          <h3 className="text-sm font-medium text-muted-foreground">Productos</h3>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-lg border p-4 text-black bg-[#FB7560]">
          <h3 className="text-sm font-medium text-muted-foreground">Mesas</h3>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
      </div>
    </div>
  );
}

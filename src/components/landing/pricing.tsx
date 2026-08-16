import Link from "next/link";
import { SUBSCRIPTION } from "@/lib/subscription";
import { Check, Sparkles } from "lucide-react";

export function PricingSection() {
  return (
    <section id="suscripcion" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Suscripción
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Una suscripción, todo habilitado
          </h2>
          <p className="mt-3 text-muted-foreground">
            Sin planes que elegir ni límites escondidos. Activá tu restaurante y
            usá cada módulo desde el día uno.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-md">
          <div className="relative flex flex-col rounded-3xl border border-primary/40 bg-card p-8 shadow-[0_18px_50px_rgba(0,0,0,0.10)] ring-1 ring-primary/20">
            <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              <Sparkles className="size-3.5" />
              Todo incluido
            </span>
            <div className="text-center">
              <h3 className="text-lg font-bold">{SUBSCRIPTION.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {SUBSCRIPTION.tagline}
              </p>
            </div>
            <div className="mt-6 flex items-baseline justify-center gap-1">
              <span className="text-5xl font-extrabold tracking-tight">
                ${SUBSCRIPTION.price}
              </span>
              <span className="text-sm text-muted-foreground">/mes</span>
            </div>
            <ul className="mt-8 space-y-2.5">
              {SUBSCRIPTION.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80"
            >
              Comenzar con {SUBSCRIPTION.name}
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Pago 100% simulado por ahora · Sin tarjeta · Cancelá cuando quieras
        </p>
      </div>
    </section>
  );
}
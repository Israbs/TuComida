import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { Download, ExternalLink, QrCode as QrCodeIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appBaseUrl, catalogUrl } from "@/lib/app-url";
import { CopyCatalogUrl } from "./copy-url";

export const dynamic = "force-dynamic";

export default async function CatalogQrPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { name: true, slug: true },
  });
  if (!tenant) redirect("/dashboard");

  const base = await appBaseUrl();
  const url = catalogUrl(base, tenant.slug);

  const qrPng = await QRCode.toDataURL(url, {
    margin: 2,
    width: 720,
    errorCorrectionLevel: "M",
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Catálogo</h1>
        <p className="text-sm text-muted-foreground">
          Este QR lleva a tus clientes directo a la carta de {tenant.name}.
          Imprimilo, pegalo en tu vidriera o compartilo en tus redes.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-[minmax(0,320px)_1fr]">
        <div className="space-y-4 rounded-2xl border bg-card p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <QrCodeIcon className="size-4" />
            Código QR del local
          </div>
          <div className="flex justify-center rounded-xl bg-white p-4">
            <Image
              src={qrPng}
              alt={`Código QR del catálogo de ${tenant.name}`}
              width={720}
              height={720}
              className="size-52"
              priority
            />
          </div>
          <p className="text-center text-sm font-semibold">{tenant.name}</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-6">
            <p className="text-sm font-medium">Link de la carta</p>
            <p className="mt-2 truncate rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              {url}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <CopyCatalogUrl url={url} />
              <a
                href={qrPng}
                download={`qr-catalogo-${tenant.slug}.png`}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
              >
                <Download className="size-4" />
                Descargar QR (PNG)
              </a>
              <Link
                href={`/c/${tenant.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                <ExternalLink className="size-4" />
                Abrir catálogo
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border bg-muted/30 p-6">
            <p className="text-sm font-medium">¿Cómo usarlo?</p>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  1
                </span>
                Descargá la imagen y guardala en el teléfono o en tu computadora.
              </li>
              <li className="flex items-start gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  2
                </span>
                Imprimila y pegala en la entrada, mesas o vidriera de tu local.
              </li>
              <li className="flex items-start gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  3
                </span>
                Tus clientes la escanean con la cámara y abren tu carta al instante.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
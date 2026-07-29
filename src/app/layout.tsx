import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

// Configuración de la fuente
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TuComida - SaaS para Restaurantes",
  description: "Sistema integral de gestión para restaurantes, cafeterías y heladerías",
  icons: {
    icon: "/logo-blanco-128px.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${outfit.className} h-full antialiased`}
    >
      <body className="min-h-full bg-[#181818] text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
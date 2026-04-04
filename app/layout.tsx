import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soluciones Informaticas | Software, Apps, Automatizacion e IA",
  description:
    "Soluciones Informaticas crea software, apps, automatizacion, sistemas de citas, informatica forense e inteligencia artificial para empresas y profesionales.",
  keywords: [
    "desarrollo de software",
    "automatizacion",
    "inteligencia artificial",
    "informatica forense",
    "sistema de citas",
    "Next.js",
    "PostgreSQL"
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

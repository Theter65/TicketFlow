import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Datelar Access | Control de Accesos & Boletería Digital",
  description:
    "Plataforma para control de accesos en eventos y emisión de entradas digitales. Producto de Datelar Labs.",
  icons: {
    icon: "/brand/datelar-access/datelar-access-icon-dark.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/brand/datelar-access/datelar-access-icon-dark.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-cyan-600 selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}

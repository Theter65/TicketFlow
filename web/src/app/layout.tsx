import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Datelar Access | Control de Accesos & Boletería Digital",
  description:
    "Plataforma para control de accesos en eventos y emisión de entradas digitales. Producto de Datelar Labs.",
  icons: {
    icon: "/brand/datelar-access/datelar-access-icon-white.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="icon" href="/brand/datelar-access/datelar-access-icon-white.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen antialiased selection:bg-cyan-600 selection:text-white font-sans transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Datelar Access | Control de Accesos & Boletería Digital",
  description:
    "Plataforma de alta velocidad para control de acceso en eventos y emisión criptográfica de entradas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-black text-white antialiased selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}

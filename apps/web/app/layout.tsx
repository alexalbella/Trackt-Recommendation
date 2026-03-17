import type { Metadata } from "next";
import { PwaRegister } from "../components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trackt Recommendation",
  description: "PWA híbrida de recomendaciones de cine y series",
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}

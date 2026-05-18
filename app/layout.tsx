import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SmokeBackground } from '@/components/ui/spooky-smoke-animation';

export const metadata: Metadata = {
  title: 'Guess the Pinterest',
  description: 'Juego de adivinar quien es el dueno de la imagen',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <div className="fixed inset-0 -z-20 bg-[#080812]">
          <SmokeBackground smokeColor="#ff1f4f" />
        </div>
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_16%_14%,rgba(255,31,79,0.36),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(255,212,71,0.18),transparent_22%),radial-gradient(circle_at_72%_82%,rgba(255,31,79,0.28),transparent_26%),linear-gradient(180deg,rgba(8,8,18,0.08),rgba(8,8,18,0.82))]" />
        {children}
      </body>
    </html>
  );
}

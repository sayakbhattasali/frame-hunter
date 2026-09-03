import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FrameHunter | Aesthetic Video & Photo Telemetry',
  description: 'Search video sequences and photography via raw perceptual color vectors and photometric curves.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090a0f] text-neutral-100 antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
        {children}
      </body>
    </html>
  );
}

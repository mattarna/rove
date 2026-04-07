import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "ROVE - L'Astrolabio AI Assistant",
  description: "AI-powered travel assistant for L'Astrolabio premium travel consultancy",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className="antialiased bg-gray-50 min-h-screen text-gray-900">
        {children}
      </body>
    </html>
  );
}

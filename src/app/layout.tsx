import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'CineBook | Premium Cinema Ticket Booking & Luxury Suites',
  description:
    'Book tickets for the latest blockbuster movies in IMAX Laser, Dolby Cinema, and VIP Recliner suites with real-time seat selection and instant QR ticketing.',
  keywords: [
    'cinema booking',
    'movie tickets',
    'IMAX Laser',
    'Dolby Atmos',
    'CineBook',
    'luxury cinema',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-gray-100 min-h-screen flex flex-col antialiased selection:bg-primary selection:text-black">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

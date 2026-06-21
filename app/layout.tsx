import type {Metadata} from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import AnalyticsTracker from '@/app/components/AnalyticsTracker';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-headline',
});

export const metadata: Metadata = {
  title: 'Corrente do Bem - Conectando Talentos e Oportunidades',
  description: 'A Corrente do Bem é um ecossistema completo de conexão para divulgar vagas, talentos, oportunidades de negócios e depoimentos com propósito social.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${plusJakarta.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased bg-[#fcf9f8] text-[#1b1c1c]">
        <AnalyticsTracker />
        {children}
      </body>
    </html>
  );
}

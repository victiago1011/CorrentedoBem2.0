import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Corrente do Bem - Painel Administrativo',
  description: 'Gestão de vagas e talentos',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

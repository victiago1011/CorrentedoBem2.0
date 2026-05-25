'use client';

import React from 'react';
import Link from 'next/link';
import { Handshake } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#f0eded] py-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 mb-12 text-left">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-[#00628c] rounded-lg flex items-center justify-center text-white">
                <Handshake className="w-5 h-5 text-left" />
              </div>
              <span className="text-xl font-bold text-[#00628c] font-headline">Corrente do Bem</span>
            </Link>
            <p className="text-[#3e4850] max-w-md leading-relaxed">
              Transformando a busca por emprego em uma jornada de respeito e conexões verdadeiras. Conectando carreiras com dignidade.
            </p>
          </div>
          <div className="col-span-1">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#00628c] mb-6 text-left">Empresa</h4>
            <ul className="space-y-4 text-left">
              <li><Link href="/#sobre-nos" className="text-[#3e4850] hover:text-[#00628c] transition-colors">Sobre Nós</Link></li>
              <li><Link href="/privacidade" className="text-[#3e4850] hover:text-[#00628c] transition-colors">Privacidade</Link></li>
              <li><Link href="/termos" className="text-[#3e4850] hover:text-[#00628c] transition-colors">Termos de Uso</Link></li>
            </ul>
          </div>
          <div className="col-span-1">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#00628c] mb-6 text-left">Suporte</h4>
            <ul className="space-y-4 text-left">
              <li><Link href="/contato" className="text-[#3e4850] hover:text-[#00628c] transition-colors">Contato</Link></li>
              <li><Link href="/#como-funciona" className="text-[#3e4850] hover:text-[#00628c] transition-colors">Ajuda</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-[#bec8d1]/30 text-center">
          <p className="text-xs font-bold text-[#6f7881] uppercase tracking-widest text-center">
            © 2024 Corrente do Bem. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

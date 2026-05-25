'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/admin');
      }
    };
    checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        // Successful login
        router.push('/admin');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Erro ao realizar login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-primary/5 p-8 md:p-12 border border-outline-variant/10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-on-primary shadow-lg shadow-primary/20 mb-6">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-[#00628c] font-headline text-center">Acesso Administrativo</h1>
          <p className="text-[#3e4850] font-medium text-center mt-2 text-sm leading-relaxed">
            Painel de Controle da Corrente do Bem
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-2xl text-error text-sm font-bold flex items-center gap-3">
            <div className="w-2 h-2 bg-error rounded-full animate-pulse shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-[#6f7881] ml-4">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#3e4850]/40 w-5 h-5" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                className="w-full pl-14 pr-6 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#00628c]/20 transition-all text-[#1b1c1c] font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-[#6f7881] ml-4">Senha</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#3e4850]/40 w-5 h-5" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-14 pr-6 py-4 bg-[#f6f3f2] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#00628c]/20 transition-all text-[#1b1c1c] font-bold"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[#00628c] text-white py-5 rounded-2xl font-black uppercase text-sm tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#00628c]/20 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Autenticando...
              </>
            ) : (
              'Entrar no Painel'
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-[#bec8d1]/10 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#00628c] hover:opacity-70 transition-opacity">
            <ArrowLeft className="w-4 h-4" />
            Voltar para o site
          </Link>
        </div>
      </motion.div>

      <footer className="mt-12 text-center text-[#6f7881] text-xs font-bold uppercase tracking-widest opacity-40">
        &copy; {new Date().getFullYear()} Corrente do Bem • Sistema de Gestão
      </footer>
    </div>
  );
}

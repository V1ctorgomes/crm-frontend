'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Credenciais inválidas');
      }

      localStorage.setItem('token', data.access_token);
      router.push('/'); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      
      {/* Efeitos de Luz no Fundo (Radial Gradients via Tailwind) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(31,168,74,0.14),transparent_22%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(250,204,21,0.12),transparent_22%)]" />
      </div>

      {/* Card Glassmorphism */}
      <div className="relative z-10 w-full max-w-[420px] mx-4 p-10 bg-white/30 backdrop-blur-xl border border-white/45 rounded-[28px] shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {/* Logo e Título */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Image 
            src="/logo.png" 
            alt="Logo" 
            width={180} 
            height={60} 
            priority
            className="mb-6 object-contain"
          />
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Bem-vindo de volta
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-sm">
            Acesse sua plataforma de gestão
          </p>
        </div>

        {error && (
          <div className="bg-red-50/80 border border-red-200 text-red-600 text-xs p-3 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-white/50 border border-slate-200/50 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#1FA84A]/10 focus:border-[#1FA84A] transition-all"
              required
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-white/50 border border-slate-200/50 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#1FA84A]/10 focus:border-[#1FA84A] transition-all"
              required
            />
          </div>

          <div className="flex items-center justify-between px-1 text-sm">
            <label className="flex items-center gap-2 cursor-pointer text-slate-500 hover:text-slate-700 transition-colors">
              <input type="checkbox" className="rounded border-slate-300 text-[#1FA84A] focus:ring-[#1FA84A]" />
              Lembrar
            </label>
            <a href="#" className="font-bold text-[#D4A900] hover:text-[#B08A00] transition-colors">
              Esqueci a senha
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full py-4 bg-gradient-to-br from-[#1FA84A] to-[#15803d] text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-green-500/20 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
          >
            {/* Efeito de brilho (Shimmer) no botão */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
            
            {loading ? 'A carregar...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-10 text-center text-sm">
          <p className="text-slate-500">
            Não tem conta?{' '}
            <a href="#" className="font-bold text-[#D4A900] hover:text-[#B08A00]">
              Criar agora
            </a>
          </p>
        </div>
      </div>

      {/* Estilo para a animação Shimmer do botão */}
      <style jsx global>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </main>
  );
}
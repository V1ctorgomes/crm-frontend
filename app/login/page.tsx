'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import './login.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/login`, {
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
        <div className="login-root">
            <div className="login-card">
                {/* Logo Centralizado */}
                <div className="flex justify-center mb-6">
                    <Image
                        src="/logo.png"
                        alt="Suporte Imagem"
                        width={180}
                        height={60}
                        priority
                    />
                </div>

                <h2 className="text-center text-2xl font-bold mb-1">Bem-vindo de volta</h2>
                <p className="text-center text-sm text-slate-500 mb-8">Acesse sua plataforma</p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs mb-6 text-center border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <input
                        type="email"
                        placeholder="Email"
                        className="login-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Senha"
                        className="login-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <div className="flex items-center justify-between mb-6 px-1">
                        <label className="flex items-center text-sm text-slate-600 gap-2 cursor-pointer">
                            <input type="checkbox" className="rounded border-slate-300" />
                            Lembrar
                        </label>
                        <a href="#" className="text-sm font-semibold text-[#D4A900] hover:underline">
                            Esqueci a senha
                        </a>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="login-btn"
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-500">
                    Não tem conta? <a href="#" className="font-bold text-[#D4A900] hover:underline">Criar agora</a>
                </div>
            </div>
        </div>
    );
}
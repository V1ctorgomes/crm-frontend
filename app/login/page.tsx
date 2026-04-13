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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Credenciais inválidas');

            // ... dentro do try/catch após validar o token
            if (data.access_token) {
                document.cookie = `token=${data.access_token}; path=/; max-age=28800; SameSite=Lax`;

                // AQUI: Mude de '/' para '/dashboard'
                router.replace('/dashboard');
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-root">
            <div className="login-card">
                <div className="flex justify-center mb-8">
                    <Image src="/logo.png" alt="Suporte Imagem" width={180} height={60} priority />
                </div>

                <h2 className="text-2xl font-bold mb-1 text-slate-800">Bem-vindo de volta</h2>
                <p className="text-sm text-slate-500 mb-8">Acesse sua plataforma</p>

                {error && <div className="error-box">{error}</div>}

                <form onSubmit={handleLogin}>
                    <input
                        type="email"
                        placeholder="E-mail"
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
                    <a href="#" className="login-forgot">Esqueceu a senha?</a>

                    <button type="submit" disabled={loading} className="login-btn">
                        {loading ? 'Validando...' : 'Entrar'}
                    </button>
                </form>

                <div className="login-footer">Não tem conta? <b>Criar agora</b></div>
            </div>
        </div>
    );
}
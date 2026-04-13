'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import './login.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Credenciais inválidas');
      }

      if (data.access_token) {
        // Salva o cookie de forma segura
        document.cookie = `token=${data.access_token}; path=/; max-age=28800; SameSite=Lax`;
        
        // Redireciona para o novo Dashboard limpo
        router.replace('/dashboard');
        router.refresh();
      } else {
        throw new Error('Token não recebido');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">SI</div>
          <h1 className="login-title">Bem-vindo de volta</h1>
          <p className="login-subtitle">Insira as suas credenciais para aceder ao CRM</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label" htmlFor="email">E-mail Corporativo</label>
            <input
              id="email"
              type="email"
              className="login-input"
              placeholder="exemplo@suporteimagem.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <div className="flex justify-between items-center mb-1.5">
              <label className="input-label !mb-0" htmlFor="password">Palavra-passe</label>
              <a href="#" className="text-xs text-[#1FA84A] hover:underline font-medium">Esqueceu?</a>
            </div>
            <input
              id="password"
              type="password"
              className="login-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? 'A autenticar...' : 'Entrar no Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}
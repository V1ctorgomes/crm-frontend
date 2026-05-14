'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api-client';
import { ensureWebPushSubscription } from '@/lib/web-push-client';

export type LoginFormMode = 'login' | 'register' | 'forgot';

type LoginResponse = { name?: string; role?: string };
type RegisterResponse = { ok?: boolean; message?: string };

/**
 * Hook com todo o estado e handlers do ecrã de login (3 modos: login, registo, esqueci).
 * O componente final só trata da UI.
 */
export function useLoginForm() {
  const [mode, setMode] = useState<LoginFormMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerPassword2, setRegisterPassword2] = useState('');
  const [error, setError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const clearMessages = () => {
    setError('');
    setRegisterSuccess('');
    setForgotSuccess('');
  };

  const resetRegisterFields = () => {
    setRegisterName('');
    setRegisterPassword2('');
  };

  const switchToLogin = () => {
    setMode('login');
    clearMessages();
    resetRegisterFields();
  };

  const switchToRegister = () => {
    setMode('register');
    clearMessages();
    resetRegisterFields();
  };

  const switchToForgot = () => {
    setMode('forgot');
    clearMessages();
    setPassword('');
    resetRegisterFields();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);
    try {
      const data = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data?.name != null && data?.role != null) {
        const dest = data.role === 'DEVELOPER' ? '/developer' : '/dashboard';
        await ensureWebPushSubscription().catch(() => undefined);
        router.replace(dest);
        router.refresh();
      } else {
        throw new Error('Resposta de login inválida.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (password !== registerPassword2) {
      setError('As palavras-passe não coincidem.');
      return;
    }
    setIsLoading(true);
    try {
      const data = await apiRequest<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name: registerName }),
      });
      setRegisterSuccess(data?.message || 'Pedido registado. Aguarde aprovação de um administrador.');
      setPassword('');
      setRegisterPassword2('');
      setRegisterName('');
      setEmail('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);
    try {
      const data = await apiRequest<RegisterResponse>('/auth/request-password-reset', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setForgotSuccess(data?.message || 'Pedido registado.');
      setEmail('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mode,
    email,
    setEmail,
    password,
    setPassword,
    registerName,
    setRegisterName,
    registerPassword2,
    setRegisterPassword2,
    error,
    registerSuccess,
    forgotSuccess,
    isLoading,
    switchToLogin,
    switchToRegister,
    switchToForgot,
    handleLogin,
    handleRegister,
    handleForgotPassword,
  } as const;
}

export type LoginFormBag = ReturnType<typeof useLoginForm>;

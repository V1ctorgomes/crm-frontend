'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { canAccessPage } from '@/lib/auth';

interface ProtectedPageProps {
  children: React.ReactNode;
  requiredRoles: string[];
  page: string;
}

export function ProtectedPage({ children, requiredRoles, page }: ProtectedPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = () => {
      // Obter informações do usuário do cache
      const stored = localStorage.getItem('crm_user_cache');
      if (stored) {
        try {
          const user = JSON.parse(stored);
          const userRole = user.role;
          const access = canAccessPage(userRole, page);
          
          setHasAccess(access);
          
          if (!access) {
            // Redirecionar para o dashboard se não tiver acesso
            router.replace('/dashboard');
          }
        } catch (error) {
          console.error('Erro ao verificar acesso:', error);
          router.replace('/login');
        }
      } else {
        router.replace('/login');
      }
      
      setIsLoading(false);
    };

    checkAccess();
  }, [router, page]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium text-sm">Verificando acesso...</span>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Vai redirecionar
  }

  return <>{children}</>;
}

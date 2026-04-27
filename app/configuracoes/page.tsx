'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { SettingsModal } from '@/components/configuracoes/SettingsModal';

export const dynamic = 'force-dynamic';

export default function ConfiguracoesPagePlaceholder() {
  const router = useRouter();

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full relative">
         <SettingsModal onClose={() => router.push('/dashboard')} />
      </main>
    </div>
  );
}
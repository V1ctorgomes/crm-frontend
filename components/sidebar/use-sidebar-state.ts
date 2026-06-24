'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Users, Code, LineChart } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { revokeWebPushSubscription } from '@/lib/web-push-client';
import { clearTrustedUserSession } from '@/lib/user-session';
import { filterMenuByRole, type CompanyModuleId } from '@/lib/company-modules';
import {
  clearActiveModuleClient,
  getModuleDefinition,
  inferModuleFromPath,
  readActiveModuleClient,
} from '@/lib/active-module';
import { writeSidebarUserCache } from './sidebar-user-cache';
import { useSidebarUser } from './use-sidebar-user';
import { useSidebarBadges } from './use-sidebar-badges';

export function useSidebarState() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { currentUser } = useSidebarUser();
  const { whatsappUnreadTotal, solicitacoesRemindersGreen, solicitacoesRemindersRed } = useSidebarBadges();

  const activeModuleId: CompanyModuleId = useMemo(() => {
    const stored = readActiveModuleClient();
    if (stored) return stored;
    return inferModuleFromPath(pathname ?? '') ?? 'comercial';
  }, [pathname]);

  const moduleDef = getModuleDefinition(activeModuleId);

  const menuItems = useMemo(() => {
    const role = currentUser?.role;
    if (role === 'DEVELOPER') {
      return filterMenuByRole(
        [
          { name: 'Equipe', icon: Users, path: '/usuarios' },
          { name: 'Developer', icon: Code, path: '/developer' },
          { name: 'Produtividade', icon: LineChart, path: '/produtividade' },
        ],
        role,
      );
    }
    return filterMenuByRole(moduleDef.menuItems, role);
  }, [currentUser?.role, moduleDef.menuItems]);

  const canOpenSettings = currentUser?.role === 'ADMIN' || currentUser?.role === 'USER';
  const isActive = (path: string) => pathname?.includes(path);

  const handleLogout = async () => {
    await revokeWebPushSubscription().catch(() => undefined);
    writeSidebarUserCache(null);
    clearTrustedUserSession();
    clearActiveModuleClient();
    localStorage.removeItem('crm_user_cache');
    localStorage.removeItem('lastActiveContact');
    await apiRequest('/auth/logout', { method: 'POST' }).catch(() => undefined);
    router.replace('/login');
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    whatsappUnreadTotal,
    solicitacoesRemindersGreen,
    solicitacoesRemindersRed,
    currentUser,
    moduleDef,
    menuItems,
    canOpenSettings,
    isActive,
    handleLogout,
  };
}

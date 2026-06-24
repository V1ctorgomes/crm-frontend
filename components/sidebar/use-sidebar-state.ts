'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Users, Code, LineChart } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { revokeWebPushSubscription } from '@/lib/web-push-client';
import {
  loadUnreadByContact,
  unreadConversationsCount,
  WHATSAPP_UNREAD_STORAGE_KEY,
} from '@/lib/whatsapp-notifications';
import { REMINDERS_BADGE_EVENT, getLastReminderBadgeSnapshot } from '@/lib/solicitacoes-reminders';
import { setTrustedUserSession, clearTrustedUserSession } from '@/lib/user-session';
import { filterMenuByRole, type CompanyModuleId } from '@/lib/company-modules';
import {
  clearActiveModuleClient,
  getModuleDefinition,
  inferModuleFromPath,
  readActiveModuleClient,
} from '@/lib/active-module';
import { readSidebarUserCache, writeSidebarUserCache, type SidebarUser } from './sidebar-user-cache';

export function useSidebarState() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [whatsappUnreadTotal, setWhatsappUnreadTotal] = useState(0);
  const [solicitacoesRemindersGreen, setSolicitacoesRemindersGreen] = useState(
    () => getLastReminderBadgeSnapshot().greenCount,
  );
  const [solicitacoesRemindersRed, setSolicitacoesRemindersRed] = useState(
    () => getLastReminderBadgeSnapshot().redCount,
  );
  const [currentUser, setCurrentUser] = useState<SidebarUser | null>(readSidebarUserCache);

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
    const cached = readSidebarUserCache();
    if (!cached && typeof window !== 'undefined') {
      const stored = localStorage.getItem('crm_user_cache');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as SidebarUser;
          writeSidebarUserCache(parsed);
          setCurrentUser(parsed);
        } catch {
          /* ignore */
        }
      }
    }

    apiRequest('/users/me')
      .then((user) => {
        if (user && typeof user === 'object') {
          const u = user as SidebarUser;
          setTrustedUserSession(u);
          if (JSON.stringify(readSidebarUserCache()) !== JSON.stringify(u)) {
            writeSidebarUserCache(u);
            setCurrentUser(u);
            if (typeof window !== 'undefined') {
              const { password: _pw, ...safe } = user as Record<string, unknown>;
              localStorage.setItem('crm_user_cache', JSON.stringify(safe));
            }
          }
        }
      })
      .catch((err) => console.error('Erro ao carregar usuario:', err));
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setWhatsappUnreadTotal(unreadConversationsCount(loadUnreadByContact()));

    const onUnread = (e: Event) => {
      const ce = e as CustomEvent<{ unreadConversations?: number; total?: number }>;
      const n = ce.detail?.unreadConversations ?? ce.detail?.total;
      if (typeof n === 'number') setWhatsappUnreadTotal(n);
    };

    const onStorage = (ev: StorageEvent) => {
      if (ev.key !== WHATSAPP_UNREAD_STORAGE_KEY) return;
      if (!ev.newValue) {
        setWhatsappUnreadTotal(0);
        return;
      }
      try {
        const o = JSON.parse(ev.newValue) as Record<string, unknown>;
        if (!o || typeof o !== 'object') {
          setWhatsappUnreadTotal(0);
          return;
        }
        const map: Record<string, number> = {};
        for (const [k, v] of Object.entries(o)) {
          const n = Number(v);
          if (Number.isFinite(n) && n > 0) map[k] = Math.min(n, 999);
        }
        setWhatsappUnreadTotal(unreadConversationsCount(map));
      } catch {
        setWhatsappUnreadTotal(0);
      }
    };

    window.addEventListener('crm-whatsapp-unread', onUnread as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('crm-whatsapp-unread', onUnread as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onReminders = (e: Event) => {
      const ce = e as CustomEvent<{ greenCount?: number; redCount?: number }>;
      if (typeof ce.detail?.greenCount === 'number') setSolicitacoesRemindersGreen(ce.detail.greenCount);
      if (typeof ce.detail?.redCount === 'number') setSolicitacoesRemindersRed(ce.detail.redCount);
    };

    window.addEventListener(REMINDERS_BADGE_EVENT, onReminders as EventListener);
    return () => {
      window.removeEventListener(REMINDERS_BADGE_EVENT, onReminders as EventListener);
    };
  }, []);

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

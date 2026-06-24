'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { setTrustedUserSession } from '@/lib/user-session';
import { readSidebarUserCache, writeSidebarUserCache, type SidebarUser } from './sidebar-user-cache';

export function useSidebarUser() {
  const [currentUser, setCurrentUser] = useState<SidebarUser | null>(readSidebarUserCache);

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

  return { currentUser };
}

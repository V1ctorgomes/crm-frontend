'use client';

import { useEffect, useState } from 'react';
import { ModulePicker } from '@/components/hub/ModulePicker';
import { apiRequest } from '@/lib/api-client';

export default function InicioPage() {
  const [user, setUser] = useState<{ name?: string; role?: string } | null>(null);

  useEffect(() => {
    void apiRequest<{ name?: string; role?: string }>('/users/me')
      .then((me) => setUser(me ?? null))
      .catch(() => setUser(null));
  }, []);

  return <ModulePicker userName={user?.name} role={user?.role} />;
}

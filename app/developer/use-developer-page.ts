'use client';

import { useCallback, useState } from 'react';
import { useDeveloperProviders } from './use-developer-providers';
import { useDeveloperProxies } from './use-developer-proxies';

export type DeveloperTab = 'providers' | 'proxies' | 'catalogo';

export function useDeveloperPage() {
  const [activeTab, setActiveTab] = useState<DeveloperTab>('providers');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  }, []);

  const providers = useDeveloperProviders(showFeedback);
  const proxies = useDeveloperProxies(showFeedback);

  return {
    activeTab,
    setActiveTab,
    toast,
    setToast,
    showFeedback,
    ...providers,
    ...proxies,
  };
}

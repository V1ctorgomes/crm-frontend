'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { MASKED_SECRET_PREFIX, secretForSave } from '@/lib/masked-secret';

export function useDeveloperProviders(showFeedback: (type: 'success' | 'error', message: string) => void) {
  const [evoBaseUrl, setEvoBaseUrl] = useState('');
  const [evoApiKey, setEvoApiKey] = useState('');
  const [cfAccountId, setCfAccountId] = useState('');
  const [cfBucket, setCfBucket] = useState('');
  const [cfAccessKey, setCfAccessKey] = useState('');
  const [cfSecretKey, setCfSecretKey] = useState('');
  const [cfPublicUrl, setCfPublicUrl] = useState('');
  const [isSavingProviders, setIsSavingProviders] = useState(false);

  const fetchProviders = useCallback(async () => {
    try {
      const [evo, cf] = await Promise.all([
        apiRequest<Record<string, unknown>>('/providers/evolution').catch(() => null),
        apiRequest<Record<string, unknown>>('/providers/cloudflare').catch(() => null),
      ]);
      const evoRec = evo && typeof evo === 'object' ? evo : null;
      const cfRec = cf && typeof cf === 'object' ? cf : null;
      if (evoRec) {
        if (typeof evoRec.baseUrl === 'string') setEvoBaseUrl(evoRec.baseUrl);
        if (typeof evoRec.apiKey === 'string' && evoRec.apiKey.startsWith(MASKED_SECRET_PREFIX)) {
          setEvoApiKey(evoRec.apiKey);
        } else if (evoRec.apiKeySet) {
          setEvoApiKey(MASKED_SECRET_PREFIX);
        }
      }
      if (cfRec) {
        if (typeof cfRec.accountId === 'string') setCfAccountId(cfRec.accountId);
        if (typeof cfRec.bucket === 'string') setCfBucket(cfRec.bucket);
        if (typeof cfRec.apiKey === 'string' && cfRec.apiKey.startsWith(MASKED_SECRET_PREFIX)) {
          setCfAccessKey(cfRec.apiKey);
        } else if (cfRec.apiKeySet) {
          setCfAccessKey(MASKED_SECRET_PREFIX);
        }
        if (typeof cfRec.apiToken === 'string' && cfRec.apiToken.startsWith(MASKED_SECRET_PREFIX)) {
          setCfSecretKey(cfRec.apiToken);
        } else if (cfRec.apiTokenSet) {
          setCfSecretKey(MASKED_SECRET_PREFIX);
        }
        if (typeof cfRec.baseUrl === 'string') setCfPublicUrl(cfRec.baseUrl);
      }
    } catch {
      showFeedback('error', 'Erro ao carregar configurações dos provedores.');
    }
  }, [showFeedback]);

  useEffect(() => {
    void fetchProviders();
  }, [fetchProviders]);

  const handleSaveEvo = useCallback(async () => {
    setIsSavingProviders(true);
    try {
      const apiKey = secretForSave(evoApiKey);
      await apiRequest('/providers/evolution', {
        method: 'POST',
        body: JSON.stringify({
          baseUrl: evoBaseUrl,
          ...(apiKey !== undefined ? { apiKey } : {}),
        }),
      });
      showFeedback('success', 'Configurações da Evolution API atualizadas!');
    } catch {
      showFeedback('error', 'Falha de conexão com o servidor.');
    }
    setIsSavingProviders(false);
  }, [evoBaseUrl, evoApiKey, showFeedback]);

  const handleSaveCf = useCallback(async () => {
    setIsSavingProviders(true);
    try {
      const apiKey = secretForSave(cfAccessKey);
      const apiToken = secretForSave(cfSecretKey);
      await apiRequest('/providers/cloudflare', {
        method: 'POST',
        body: JSON.stringify({
          accountId: cfAccountId,
          bucket: cfBucket,
          baseUrl: cfPublicUrl,
          ...(apiKey !== undefined ? { apiKey } : {}),
          ...(apiToken !== undefined ? { apiToken } : {}),
        }),
      });
      showFeedback('success', 'Configurações da Cloudflare atualizadas!');
    } catch {
      showFeedback('error', 'Falha de conexão com o servidor.');
    }
    setIsSavingProviders(false);
  }, [cfAccountId, cfBucket, cfAccessKey, cfSecretKey, cfPublicUrl, showFeedback]);

  return {
    evoBaseUrl,
    setEvoBaseUrl,
    evoApiKey,
    setEvoApiKey,
    cfAccountId,
    setCfAccountId,
    cfBucket,
    setCfBucket,
    cfAccessKey,
    setCfAccessKey,
    cfSecretKey,
    setCfSecretKey,
    cfPublicUrl,
    setCfPublicUrl,
    isSavingProviders,
    handleSaveEvo,
    handleSaveCf,
  };
}

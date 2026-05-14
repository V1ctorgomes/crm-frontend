'use client';

import Sidebar from '@/components/Sidebar';
import { Toast } from '@/components/ui/toast';
import { DeveloperHeader } from '@/components/developer/DeveloperHeader';
import { DeveloperTabs } from '@/components/developer/DeveloperTabs';
import { EvolutionCard } from '@/components/developer/EvolutionCard';
import { CloudflareCard } from '@/components/developer/CloudflareCard';
import { ProxyForm } from '@/components/developer/ProxyForm';
import { ProxiesTable } from '@/components/developer/ProxiesTable';
import { CatalogOsManager } from '@/components/developer/CatalogOsManager';
import { useDeveloperPage } from './use-developer-page';

export const dynamic = 'force-dynamic';

export default function DeveloperPage() {
  const d = useDeveloperPage();

  return (
    <div className="flex h-screen overflow-hidden bg-brand-canvas font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden overflow-y-auto no-scrollbar selection:bg-brand-100 selection:text-brand-900">
        {d.toast && (
          <Toast
            type={d.toast.type}
            message={d.toast.message}
            onDismiss={() => d.setToast(null)}
          />
        )}

        <DeveloperHeader />

        <div className="px-6 md:px-8 pb-12 flex flex-col gap-6 animate-in fade-in duration-500">
          <DeveloperTabs activeTab={d.activeTab} setActiveTab={d.setActiveTab} />

          {d.activeTab === 'providers' ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              <EvolutionCard
                evoBaseUrl={d.evoBaseUrl}
                setEvoBaseUrl={d.setEvoBaseUrl}
                evoApiKey={d.evoApiKey}
                setEvoApiKey={d.setEvoApiKey}
                isSavingProviders={d.isSavingProviders}
                handleSaveEvo={d.handleSaveEvo}
              />
              <CloudflareCard
                cfAccountId={d.cfAccountId}
                setCfAccountId={d.setCfAccountId}
                cfBucket={d.cfBucket}
                setCfBucket={d.setCfBucket}
                cfAccessKey={d.cfAccessKey}
                setCfAccessKey={d.setCfAccessKey}
                cfSecretKey={d.cfSecretKey}
                setCfSecretKey={d.setCfSecretKey}
                cfPublicUrl={d.cfPublicUrl}
                setCfPublicUrl={d.setCfPublicUrl}
                isSavingProviders={d.isSavingProviders}
                handleSaveCf={d.handleSaveCf}
              />
            </div>
          ) : d.activeTab === 'proxies' ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
              <ProxyForm
                proxyForm={d.proxyForm}
                setProxyForm={d.setProxyForm}
                loadingProxies={d.loadingProxies}
                handleSaveProxy={d.handleSaveProxy}
              />
              <ProxiesTable proxies={d.proxies} handleDeleteProxy={d.handleDeleteProxy} />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-600 max-w-3xl">
                Estas listas alimentam os campos <strong>Marca</strong>, <strong>Modelo</strong>,{' '}
                <strong>Tipo de cliente</strong> e <strong>Tipo de solicitação</strong> ao criar uma OS na página de
                solicitações ou no WhatsApp. Só entram valores cadastrados aqui (e ativos).
              </p>
              <CatalogOsManager showFeedback={d.showFeedback} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

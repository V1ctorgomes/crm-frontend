'use client';

import Sidebar from '@/components/Sidebar';
import { Toast } from '@/components/ui/toast';
import { ProdutividadeHeader } from '@/components/produtividade/ProdutividadeHeader';
import { KpiCards } from '@/components/produtividade/KpiCards';
import { UserStatsTable } from '@/components/produtividade/UserStatsTable';
import { FunnelPanel } from '@/components/produtividade/FunnelPanel';
import { DailyChart } from '@/components/produtividade/DailyChart';
import { UserDetailDrawer } from '@/components/produtividade/UserDetailDrawer';
import { useProdutividadePage } from './use-produtividade-page';

export const dynamic = 'force-dynamic';

export default function ProdutividadePage() {
  const p = useProdutividadePage();

  return (
    <div className="flex h-screen overflow-hidden bg-brand-canvas font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden overflow-y-auto crm-thin-scrollbar selection:bg-brand-100 selection:text-brand-900">
        {p.toast && (
          <Toast
            type={p.toast.type}
            message={p.toast.message}
            onDismiss={() => p.setToast(null)}
          />
        )}

        <div className="mx-auto w-full max-w-[1600px]">
          <ProdutividadeHeader
            period={p.period}
            onPeriodChange={p.setPeriod}
            isRefreshing={p.isLoading}
            onRefresh={() => void p.fetchData()}
            onExportSpreadsheet={() => void p.handleExportSpreadsheet()}
            canExport={p.data.perUser.length > 0}
          />

          <div className="px-4 sm:px-6 md:px-8 py-6 md:py-8 flex flex-col gap-8 md:gap-10 pb-12">
            <KpiCards totals={p.data.totals} isLoading={p.isLoading} />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8 items-stretch">
              <div className="lg:col-span-3 min-w-0 flex flex-col">
                <DailyChart data={p.data.daily} isLoading={p.isLoading} />
              </div>
              <div className="lg:col-span-2 min-w-0 flex flex-col lg:sticky lg:top-4 self-start">
                <FunnelPanel funnel={p.data.funnel} isLoading={p.isLoading} />
              </div>
            </div>

            <UserStatsTable
              rows={p.data.perUser}
              isLoading={p.isLoading}
              onUserClick={p.setSelectedUser}
            />
          </div>
        </div>
      </main>

      <UserDetailDrawer
        user={p.selectedUser}
        periodLabel={p.periodLabel}
        onClose={() => p.setSelectedUser(null)}
      />
    </div>
  );
}

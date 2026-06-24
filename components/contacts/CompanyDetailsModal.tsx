'use client';

import React from 'react';
import type { Company } from '@/lib/companies';
import { DeleteConfirmModal } from '@/components/arquivos/DeleteConfirmModal';
import { useCompanyDetailsModal, type AvailableContact } from './use-company-details-modal';
import { CompanyDetailsHeader } from './CompanyDetailsHeader';
import { CompanyLinkContactSection } from './CompanyLinkContactSection';
import { CompanyLinkedContactsList } from './CompanyLinkedContactsList';

interface CompanyDetailsModalProps {
  company: Company;
  allContacts: AvailableContact[];
  onClose: () => void;
  onChanged: () => void;
  onShowFeedback: (type: 'success' | 'error', message: string) => void;
}

export function CompanyDetailsModal({
  company,
  allContacts,
  onClose,
  onChanged,
  onShowFeedback,
}: CompanyDetailsModalProps) {
  const {
    loading,
    linked,
    ticketCount,
    searchTerm,
    setSearchTerm,
    linking,
    unlinkConfirm,
    setUnlinkConfirm,
    candidates,
    handleLink,
    handleUnlink,
  } = useCompanyDetailsModal(company, allContacts, onChanged, onShowFeedback);

  return (
    <div
      className="fixed inset-0 bg-brand-950/45 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <CompanyDetailsHeader company={company} ticketCount={ticketCount} onClose={onClose} />

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <CompanyLinkContactSection
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            candidates={candidates}
            linking={linking}
            onLink={handleLink}
          />
          <CompanyLinkedContactsList
            loading={loading}
            linked={linked}
            linking={linking}
            onUnlinkRequest={(number, label) => setUnlinkConfirm({ number, label })}
          />
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-brand-950 h-10 px-4 py-2"
          >
            Fechar
          </button>
        </div>
      </div>

      {unlinkConfirm && (
        <DeleteConfirmModal
          title="Desvincular contato?"
          message={`O contato «${unlinkConfirm.label}» deixará de estar associado a ${company.legalName}.`}
          onClose={() => setUnlinkConfirm(null)}
          onConfirm={async (deleteReason?: string) => {
            await handleUnlink(unlinkConfirm.number, deleteReason);
            setUnlinkConfirm(null);
          }}
        />
      )}
    </div>
  );
}

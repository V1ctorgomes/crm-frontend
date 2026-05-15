'use client';

import Sidebar from '@/components/Sidebar';
import { Toast } from '@/components/ui/toast';
import { ContactsHeader } from '@/components/contacts/ContactsHeader';
import { ContactsSectionTabs } from '@/components/contacts/ContactsSectionTabs';
import { ContactsTable } from '@/components/contacts/ContactsTable';
import { CompaniesTable } from '@/components/contacts/CompaniesTable';
import { EditContactModal } from '@/components/contacts/EditContactModal';
import { DeleteContactModal } from '@/components/contacts/DeleteContactModal';
import { CompanyFormModal } from '@/components/contacts/CompanyFormModal';
import { CompanyDetailsModal } from '@/components/contacts/CompanyDetailsModal';
import { DeleteCompanyModal } from '@/components/contacts/DeleteCompanyModal';
import { useContactsPage } from './use-contacts-page';

export const dynamic = 'force-dynamic';

export default function ContactsPage() {
  const c = useContactsPage();
  const isCompaniesTab = c.listSection === 'companies';

  return (
    <div className="flex h-screen overflow-hidden bg-brand-canvas font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden overflow-y-auto no-scrollbar selection:bg-brand-100 selection:text-brand-900">
        {c.toast && (
          <Toast
            type={c.toast.type}
            message={c.toast.message}
            onDismiss={() => c.setToast(null)}
          />
        )}

        <ContactsHeader
          totalContacts={c.contacts.length}
          totalCompanies={c.companies.length}
          isCompaniesTab={isCompaniesTab}
          searchTerm={c.searchTerm}
          onSearchChange={c.setSearchTerm}
          onCreateCompany={() => c.openCreateCompanyModal()}
        />

        <ContactsSectionTabs
          value={c.listSection}
          onChange={c.setListSection}
          customerCount={c.kindCounts.customer}
          internalCount={c.kindCounts.internal}
          unknownCount={c.kindCounts.unknown}
          companiesCount={c.companies.length}
        />

        {isCompaniesTab ? (
          <CompaniesTable
            isLoading={c.companiesLoading}
            companies={c.paginatedCompanies}
            onOpen={(co) => c.setCompanyDetails(co)}
            onEdit={(co) => c.openEditCompanyModal(co)}
            onDelete={(co) => c.setCompanyToDelete(co)}
            pagination={{
              page: c.tablePage,
              pageSize: c.PAGE_SIZE,
              total: c.filteredCompanies.length,
              onPageChange: c.setTablePage,
            }}
          />
        ) : (
          <ContactsTable
            isLoading={c.isLoading}
            contacts={c.paginatedContacts}
            onEdit={c.openEditModal}
            onDelete={c.setContactToDelete}
            pagination={{
              page: c.tablePage,
              pageSize: c.PAGE_SIZE,
              total: c.filteredContacts.length,
              onPageChange: c.setTablePage,
            }}
          />
        )}
      </main>

      {c.isEditing && c.editingContact && (
        <EditContactModal
          contactNumber={c.editingContact.number}
          contactName={c.editingContact.name}
          editName={c.editName}
          setEditName={c.setEditName}
          editEmail={c.editEmail}
          setEditEmail={c.setEditEmail}
          editCnpj={c.editCnpj}
          setEditCnpj={c.setEditCnpj}
          editContactKind={c.editContactKind}
          setEditContactKind={c.setEditContactKind}
          isSaving={c.isSaving}
          onClose={() => c.setIsEditing(false)}
          onSave={c.handleSaveContact}
          linkedCompanies={c.linkedCompaniesForEditing}
          allCompanies={c.companies}
          onLinkCompany={c.linkCompanyToContact}
          onUnlinkCompany={c.unlinkCompanyFromContact}
          onRequestCreateCompany={(initialLegalName) => c.openCreateCompanyModal(initialLegalName)}
          linkBusy={c.linkBusy}
        />
      )}

      {c.contactToDelete && (
        <DeleteContactModal
          contact={c.contactToDelete}
          onClose={() => c.setContactToDelete(null)}
          onConfirm={c.handleDeleteContact}
        />
      )}

      {c.isCompanyFormOpen && (
        <CompanyFormModal
          initial={c.editingCompany}
          isSaving={c.companyFormSaving}
          onClose={c.closeCompanyForm}
          onSubmit={c.handleSubmitCompany}
          defaultCnpj={c.companyFormDefaultCnpj}
          defaultLegalName={c.companyFormDefaultLegalName}
        />
      )}

      {c.companyDetails && (
        <CompanyDetailsModal
          company={c.companyDetails}
          allContacts={c.contacts.map((co) => ({ number: co.number, name: co.name, profilePictureUrl: co.profilePictureUrl }))}
          onClose={() => c.setCompanyDetails(null)}
          onChanged={() => {
            void c.fetchCompanies();
            void c.fetchContacts();
          }}
          onShowFeedback={c.showFeedback}
        />
      )}

      {c.companyToDelete && (
        <DeleteCompanyModal
          company={c.companyToDelete}
          onClose={() => c.setCompanyToDelete(null)}
          onConfirm={c.handleDeleteCompany}
        />
      )}
    </div>
  );
}

'use client';

import Sidebar from '@/components/Sidebar';
import { Toast } from '@/components/ui/toast';
import { UsuariosHeader } from '@/components/usuarios/UsuariosHeader';
import { UsuariosTable } from '@/components/usuarios/UsuariosTable';
import { UserFormModal } from '@/components/usuarios/UserFormModal';
import { DeleteUserModal } from '@/components/usuarios/DeleteUserModal';
import { PendingUsersPanel } from '@/components/usuarios/PendingUsersPanel';
import { PasswordResetRequestsPanel } from '@/components/usuarios/PasswordResetRequestsPanel';
import { UserDeletionsRevertPanel } from '@/components/usuarios/UserDeletionsRevertPanel';
import { UsuariosSectionTabs } from '@/components/usuarios/UsuariosSectionTabs';
import { useUsuariosPage } from './use-usuarios-page';

export const dynamic = 'force-dynamic';

export default function UsuariosPage() {
  const u = useUsuariosPage();

  return (
    <div className="flex h-screen overflow-hidden bg-brand-canvas font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden overflow-y-auto no-scrollbar selection:bg-brand-100 selection:text-brand-900">
        {u.toast && (
          <Toast
            type={u.toast.type}
            message={u.toast.message}
            onDismiss={() => u.setToast(null)}
          />
        )}

        <UsuariosHeader
          totalUsers={u.users.length}
          pendingCount={u.isAdmin ? u.pendingUsers.length : 0}
          passwordResetCount={u.isAdmin ? u.passwordResetRequests.length : 0}
          revertibleDeletionCount={u.isAdmin ? (u.deletionAudits?.revertibleCount ?? 0) : 0}
          showToolbar={!u.isAdmin || u.adminSection === 'users'}
          searchTerm={u.searchTerm}
          onSearchChange={u.setSearchTerm}
          onNewUser={() => u.openModal()}
        />

        {u.isAdmin && (
          <UsuariosSectionTabs
            value={u.adminSection}
            onChange={u.setAdminSection}
            pendingCount={u.pendingUsers.length}
            passwordResetCount={u.passwordResetRequests.length}
            revertibleCount={u.deletionAudits?.revertibleCount ?? 0}
          />
        )}

        {u.isAdmin && u.adminSection === 'pending' && (
          <div className="mx-6 md:mx-8">
            <PendingUsersPanel
              users={u.pendingUsers}
              approvingId={u.approvingId}
              onApprove={u.handleApprovePending}
            />
          </div>
        )}

        {u.isAdmin && u.adminSection === 'password' && (
          <div className="mx-6 md:mx-8">
            <PasswordResetRequestsPanel
              requests={u.passwordResetRequests}
              onCompleted={u.onPasswordPanelCompleted}
              showFeedback={u.showFeedback}
            />
          </div>
        )}

        {u.isAdmin && u.adminSection === 'reverts' && (
          <div className="mx-6 md:mx-8">
            <UserDeletionsRevertPanel
              items={u.deletionAudits?.items ?? []}
              isLoading={u.deletionAuditsLoading}
              revertingId={u.revertingAuditId}
              onRevert={u.handleRevertDeletion}
              onRefresh={() => void u.fetchDeletionAudits()}
            />
          </div>
        )}

        {(!u.isAdmin || u.adminSection === 'users') && (
          <UsuariosTable
            isLoading={u.isLoading}
            users={u.paginatedUsers}
            onEdit={u.openModal}
            onDelete={u.setUserToDelete}
            pagination={{
              page: u.tablePage,
              pageSize: u.PAGE_SIZE,
              total: u.filteredUsers.length,
              onPageChange: u.setTablePage,
            }}
          />
        )}
      </main>

      {u.isModalOpen && (
        <UserFormModal
          viewerRole={u.viewerRole}
          viewerId={u.viewerId}
          editingUser={u.editingUser}
          formName={u.formName}
          setFormName={u.setFormName}
          formEmail={u.formEmail}
          setFormEmail={u.setFormEmail}
          formRole={u.formRole}
          setFormRole={u.setFormRole}
          formPassword={u.formPassword}
          setFormPassword={u.setFormPassword}
          isSaving={u.isSaving}
          onClose={() => u.setIsModalOpen(false)}
          onSave={u.handleSave}
        />
      )}

      {u.userToDelete && (
        <DeleteUserModal
          user={u.userToDelete}
          onClose={() => u.setUserToDelete(null)}
          onConfirm={u.handleDelete}
        />
      )}
    </div>
  );
}

'use client';

import React from 'react';
import { ProfileTab } from './ProfileTab';
import { ConnectionsTab } from './ConnectionsTab';
import { NotificationsSettingsTab } from './NotificationsSettingsTab';
import { useSettingsModal } from './use-settings-modal';
import { SettingsModalChrome } from './settings-modal/SettingsModalChrome';
import { SettingsNestedOverlays } from './settings-modal/SettingsNestedOverlays';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const s = useSettingsModal();

  return (
    <div
      className="fixed inset-0 bg-brand-950/45 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onMouseDown={onClose}
    >
      <SettingsModalChrome
        onClose={onClose}
        toast={s.toast}
        onDismissToast={() => s.setToast(null)}
        activeTab={s.activeTab}
        onTabChange={s.setActiveTab}
      >
        {s.activeTab === 'perfil' ? (
          <ProfileTab
            isProfileLoading={s.isProfileLoading}
            isSavingProfile={s.isSavingProfile}
            userData={s.userData}
            name={s.name}
            setName={s.setName}
            email={s.email}
            setEmail={s.setEmail}
            password={s.password}
            setPassword={s.setPassword}
            photoPreview={s.photoPreview}
            fileInputRef={s.fileInputRef}
            handlePhotoSelect={s.handlePhotoSelect}
            handleSaveProfile={s.handleSaveProfile}
          />
        ) : s.activeTab === 'conexoes' ? (
          <ConnectionsTab
            selectedProvider={s.selectedProvider}
            setSelectedProvider={s.setSelectedProvider}
            instances={s.instances}
            instancesHealth={s.instancesHealth}
            isInstancesLoading={s.isInstancesLoading}
            availableProxies={s.availableProxies}
            newInstanceName={s.newInstanceName}
            setNewInstanceName={s.setNewInstanceName}
            selectedProxyId={s.selectedProxyId}
            setSelectedProxyId={s.setSelectedProxyId}
            isCreatingInstance={s.isCreatingInstance}
            handleCreateInstance={s.handleCreateInstance}
            handleConnectInstance={s.handleConnectInstance}
            handleDeleteInstance={s.handleDeleteInstance}
          />
        ) : (
          <NotificationsSettingsTab showFeedback={s.showFeedback} />
        )}
      </SettingsModalChrome>

      <SettingsNestedOverlays
        qrCodeData={s.qrCodeData}
        onCloseQr={() => s.setQrCodeData(null)}
        confirmModal={s.confirmModal}
        onCloseConfirm={() => s.setConfirmModal(null)}
      />
    </div>
  );
}

'use client';

import { useState, useRef, useCallback } from 'react';
import { apiRequest } from '@/lib/api-client';
import type { SettingsMeUser } from './types';

type ShowFeedback = (type: 'success' | 'error', message: string) => void;

export function useSettingsProfile(showFeedback: ShowFeedback) {
  const [userData, setUserData] = useState<SettingsMeUser | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = useCallback(async () => {
    const currentUser = await apiRequest<SettingsMeUser | null>('/users/me').catch(() => null);
    if (currentUser) {
      setUserData(currentUser);
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      if (currentUser.profilePictureUrl) setPhotoPreview(currentUser.profilePictureUrl);
    } else {
      showFeedback('error', 'Erro ao carregar usuario.');
    }
    setIsProfileLoading(false);
    return currentUser;
  }, [showFeedback]);

  const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }, []);

  const handleSaveProfile = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userData) return;
      setIsSavingProfile(true);
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      if (password.trim() !== '') formData.append('password', password);
      if (photoFile) formData.append('file', photoFile);

      try {
        await apiRequest(`/users/${userData.id}`, { method: 'PUT', body: formData });
        showFeedback('success', 'Perfil atualizado com sucesso!');
        setPassword('');
      } catch {
        showFeedback('error', 'Erro de ligação ao servidor.');
      } finally {
        setIsSavingProfile(false);
      }
    },
    [userData, name, email, password, photoFile, showFeedback],
  );

  return {
    userData,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    photoPreview,
    fileInputRef,
    isProfileLoading,
    isSavingProfile,
    handlePhotoSelect,
    handleSaveProfile,
    loadProfile,
  };
}

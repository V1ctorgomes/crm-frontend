'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, Link as LinkIcon, AlertTriangle, QrCode, X } from 'lucide-react';
import { Toast } from '@/components/ui/toast';
import { ProfileTab } from './ProfileTab';
import { ConnectionsTab } from './ConnectionsTab';
import { Instance, ProxyNode } from './types';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'perfil' | 'conexoes'>('perfil');
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  // ================= ESTADOS =================
  const [userData, setUserData] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [instances, setInstances] = useState<Instance[]>([]);
  const [isInstancesLoading, setIsInstancesLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [availableProxies, setAvailableProxies] = useState<ProxyNode[]>([]);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [selectedProxyId, setSelectedProxyId] = useState<string>('');
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{ base64?: string; pairingCode?: string } | null>(null);

  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchUserData();
    fetchInstances();
    fetchProxies();
  }, []);

  const fetchProxies = async () => {
    try {
      const res = await fetch(`${baseUrl}/proxies`);
      if (res.ok) setAvailableProxies(await res.json());
    } catch (err) {}
  };

  const fetchUserData = async () => {
    try {
      const res = await fetch(`${baseUrl}/users`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const currentUser = data[0];
          setUserData(currentUser);
          setName(currentUser.name || '');
          setEmail(currentUser.email || '');
          if (currentUser.profilePictureUrl) setPhotoPreview(currentUser.profilePictureUrl);
        }
      }
    } catch (error) { showFeedback('error', 'Erro ao carregar utilizador.'); } 
    finally { setIsProfileLoading(false); }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;
    setIsSavingProfile(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    if (password.trim() !== '') formData.append('password', password);
    if (photoFile) formData.append('file', photoFile);

    try {
      const res = await fetch(`${baseUrl}/users/${userData.id}`, { method: 'PUT', body: formData });
      if (res.ok) { showFeedback('success', 'Perfil atualizado com sucesso!'); setPassword(''); } 
      else showFeedback('error', 'Falha ao atualizar perfil.');
    } catch (error) { showFeedback('error', 'Erro de ligação ao servidor.'); } 
    finally { setIsSavingProfile(false); }
  };

  const fetchInstances = async () => {
    try {
      const resUsers = await fetch(`${baseUrl}/users`);
      if (resUsers.ok) {
        const users = await resUsers.json();
        if (users.length > 0) {
          const res = await fetch(`${baseUrl}/instances/user/${users[0].id}`);
          if (res.ok) setInstances(await res.json());
        }
      }
    } catch (error) {} 
    finally { setIsInstancesLoading(false); }
  };

  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstanceName.trim()) return;
    setIsCreatingInstance(true);

    try {
      const resUsers = await fetch(`${baseUrl}/users`);
      const users = await resUsers.json();
      const payload: any = { name: newInstanceName, userId: users[0].id };
      if (selectedProxyId) {
        const selectedProxy = availableProxies.find(p => p.id === selectedProxyId);
        if (selectedProxy) {
          payload.proxyHost = selectedProxy.host;
          payload.proxyPort = String(selectedProxy.port);
          payload.proxyUser = selectedProxy.username;
          payload.proxyPass = selectedProxy.password;
          payload.proxyProto = selectedProxy.protocol;
        }
      }

      const res = await fetch(`${baseUrl}/instances`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        setNewInstanceName(''); setSelectedProxyId(''); await fetchInstances(); showFeedback('success', 'Instância criada com sucesso!');
      } else {
        const errorData = await res.json().catch(() => null); showFeedback('error', errorData?.message || "Erro ao criar instância.");
      }
    } catch (error) { showFeedback('error', "Erro de conexão com o servidor."); } 
    finally { setIsCreatingInstance(false); }
  };

  const handleDeleteInstance = (instanceName: string) => {
    setConfirmModal({
      isOpen: true, title: "Excluir Instância?", message: "Tem a certeza que deseja excluir esta conexão?",
      onConfirm: async () => {
        try {
          const res = await fetch(`${baseUrl}/instances/${instanceName}`, { method: 'DELETE' });
          if (res.ok) { await fetchInstances(); showFeedback('success', 'Instância removida com sucesso.'); } 
          else showFeedback('error', 'Não foi possível remover a instância.');
        } catch (error) { showFeedback('error', 'Erro de conexão ao remover.'); }
        setConfirmModal(null);
      }
    });
  };

  const handleConnectInstance = async (name: string) => {
    try {
      const res = await fetch(`${baseUrl}/instances/connect/${name}`);
      if (res.ok) setQrCodeData(await res.json());
      else { const errData = await res.json(); showFeedback('error', errData.message || 'Erro ao gerar QR Code'); }
    } catch (error) { showFeedback('error', "Erro ao conectar à Evolution API."); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={onClose}>
      <div className="bg-[#f8fafc] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] h-[700px] overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200" onMouseDown={e => e.stopPropagation()}>
        
        {toast && <Toast type={toast.type} message={toast.message} />}

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Configurações da Conta</h2>
            <p className="text-sm text-slate-500">Gira as suas preferências e integrações do sistema.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          
          {/* Menu Lateral Interno */}
          <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-4 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto border-b md:border-b-0">
            <button 
              onClick={() => setActiveTab('perfil')} 
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all text-left ${activeTab === 'perfil' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 border border-transparent'}`}
            >
              <User className={`w-5 h-5 ${activeTab === 'perfil' ? 'text-blue-600' : 'text-slate-400'}`} /> O Meu Perfil
            </button>
            <button 
              onClick={() => setActiveTab('conexoes')} 
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all text-left ${activeTab === 'conexoes' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 border border-transparent'}`}
            >
              <LinkIcon className={`w-5 h-5 ${activeTab === 'conexoes' ? 'text-blue-600' : 'text-slate-400'}`} /> Conexões API
            </button>
          </div>

          {/* Área de Conteúdo */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white no-scrollbar relative">
            {activeTab === 'perfil' ? (
              <ProfileTab 
                isProfileLoading={isProfileLoading} isSavingProfile={isSavingProfile} userData={userData}
                name={name} setName={setName} email={email} setEmail={setEmail} password={password} setPassword={setPassword}
                photoPreview={photoPreview} fileInputRef={fileInputRef} handlePhotoSelect={handlePhotoSelect} handleSaveProfile={handleSaveProfile}
              />
            ) : (
              <ConnectionsTab 
                selectedProvider={selectedProvider} setSelectedProvider={setSelectedProvider} instances={instances}
                isInstancesLoading={isInstancesLoading} availableProxies={availableProxies} newInstanceName={newInstanceName}
                setNewInstanceName={setNewInstanceName} selectedProxyId={selectedProxyId} setSelectedProxyId={setSelectedProxyId}
                isCreatingInstance={isCreatingInstance} handleCreateInstance={handleCreateInstance} handleConnectInstance={handleConnectInstance}
                handleDeleteInstance={handleDeleteInstance}
              />
            )}
          </div>
        </div>
      </div>

      {/* Sobreposição de QR Code / Confirm (Aninhados no Modal principal) */}
      {qrCodeData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4" onClick={() => setQrCodeData(null)}>
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full flex flex-col items-center text-center animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><QrCode className="w-5 h-5 text-blue-600" /> Ligar WhatsApp</h3>
            {qrCodeData.base64 && <img src={qrCodeData.base64.startsWith('data:') ? qrCodeData.base64 : `data:image/png;base64,${qrCodeData.base64}`} alt="QR Code" className="w-56 h-56 border p-2 rounded-lg" />}
            <button onClick={() => setQrCodeData(null)} className="mt-6 w-full bg-slate-900 text-white h-10 rounded-md font-medium hover:bg-slate-800 transition-colors">Fechar</button>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4" onClick={() => setConfirmModal(null)}>
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full text-center animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4 bg-red-50 rounded-full p-2" />
            <h3 className="font-bold text-lg mb-2 text-slate-900">{confirmModal.title}</h3>
            <p className="text-sm text-slate-500 mb-6">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} className="flex-1 h-10 rounded-md border border-slate-200 text-sm font-medium hover:bg-slate-50 text-slate-700">Cancelar</button>
              <button onClick={confirmModal.onConfirm} className="flex-1 h-10 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 shadow-sm">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
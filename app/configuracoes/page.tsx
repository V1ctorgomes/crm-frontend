'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  User, 
  Link as LinkIcon, 
  Camera, 
  Smartphone, 
  Trash2, 
  QrCode, 
  AlertTriangle,
  Loader2,
  Plus,
  ChevronLeft
} from 'lucide-react';

interface Instance {
  id: string;
  name: string;
  status: string;
  userId: string;
  createdAt: string;
  proxyHost?: string;
  proxyPort?: string;
}

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<'perfil' | 'conexoes'>('perfil');
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  // ================= ESTADOS DO PERFIL =================
  const [userData, setUserData] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ================= ESTADOS DAS CONEXÕES =================
  const [instances, setInstances] = useState<Instance[]>([]);
  const [isInstancesLoading, setIsInstancesLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [availableProxies, setAvailableProxies] = useState<any[]>([]);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [selectedProxyId, setSelectedProxyId] = useState<string>('');
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{ base64?: string; pairingCode?: string } | null>(null);

  // ================= FEEDBACK E MODAIS =================
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
    } catch (err) { console.error("Erro ao carregar proxies", err); }
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
    } catch (error) {
      showFeedback('error', 'Erro ao carregar dados do utilizador.');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
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
      const res = await fetch(`${baseUrl}/users/${userData.id}`, {
        method: 'PUT',
        body: formData,
      });
      if (res.ok) {
        showFeedback('success', 'Perfil atualizado com sucesso!');
        setPassword('');
      } else {
        showFeedback('error', 'Falha ao atualizar perfil.');
      }
    } catch (error) {
      showFeedback('error', 'Erro de ligação ao servidor.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const fetchInstances = async () => {
    try {
      const resUsers = await fetch(`${baseUrl}/users`);
      if (resUsers.ok) {
        const users = await resUsers.json();
        if (users.length > 0) {
          const userId = users[0].id;
          const res = await fetch(`${baseUrl}/instances/user/${userId}`);
          if (res.ok) setInstances(await res.json());
        }
      }
    } catch (error) {
      console.error('Erro ao buscar instâncias', error);
    } finally {
      setIsInstancesLoading(false);
    }
  };

  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstanceName.trim()) return;
    setIsCreatingInstance(true);

    try {
      const resUsers = await fetch(`${baseUrl}/users`);
      const users = await resUsers.json();
      const userId = users[0].id;

      const payload: any = { name: newInstanceName, userId };
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

      const res = await fetch(`${baseUrl}/instances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setNewInstanceName('');
        setSelectedProxyId('');
        await fetchInstances();
        showFeedback('success', 'Instância criada com sucesso!');
      } else {
        const errorData = await res.json().catch(() => null);
        showFeedback('error', errorData?.message || "Erro ao criar instância.");
      }
    } catch (error) {
      showFeedback('error', "Erro de conexão com o servidor.");
    } finally {
      setIsCreatingInstance(false);
    }
  };

  const handleDeleteInstance = (instanceName: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Instância?",
      message: "Tem a certeza que deseja excluir esta conexão?",
      onConfirm: async () => {
        try {
          const res = await fetch(`${baseUrl}/instances/${instanceName}`, { method: 'DELETE' });
          if (res.ok) {
            await fetchInstances();
            showFeedback('success', 'Instância removida com sucesso.');
          } else {
            showFeedback('error', 'Não foi possível remover a instância.');
          }
        } catch (error) {
          showFeedback('error', 'Erro de conexão ao remover.');
        }
        setConfirmModal(null);
      }
    });
  };

  const handleConnectInstance = async (name: string) => {
    try {
      const res = await fetch(`${baseUrl}/instances/connect/${name}`);
      if (res.ok) {
        const data = await res.json();
        setQrCodeData(data);
      } else {
        const errData = await res.json();
        showFeedback('error', errData.message || 'Erro ao gerar QR Code');
      }
    } catch (error) {
      showFeedback('error', "Erro ao conectar à Evolution API.");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden overflow-y-auto no-scrollbar selection:bg-blue-100 selection:text-blue-900">
        
        {toast && (
          <div className="fixed top-4 right-4 md:top-8 md:right-8 z-[9999] animate-in slide-in-from-top-5 fade-in duration-300">
            <div className="px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 border bg-white border-slate-200 text-sm font-medium text-slate-800">
               <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
               {toast.message}
            </div>
          </div>
        )}

        <header className="px-6 md:px-8 pt-8 md:pt-10 pb-6 flex flex-col shrink-0 z-10">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Configurações da Conta</h1>
          <p className="text-slate-500 text-sm mt-1">Gira as suas preferências e integrações do sistema.</p>
        </header>

        <div className="px-6 md:px-8 pb-12 flex flex-col gap-6">
          <div className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500 w-full sm:w-auto self-start">
            <button 
              onClick={() => setActiveTab('perfil')} 
              className={`inline-flex items-center gap-2 justify-center px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'perfil' ? 'bg-white text-slate-950 shadow-sm' : 'hover:text-slate-900'}`}
            >
              <User className="w-4 h-4" /> O Meu Perfil
            </button>
            <button 
              onClick={() => setActiveTab('conexoes')} 
              className={`inline-flex items-center gap-2 justify-center px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'conexoes' ? 'bg-white text-slate-950 shadow-sm' : 'hover:text-slate-900'}`}
            >
              <LinkIcon className="w-4 h-4" /> Conexões API
            </button>
          </div>

          <div className="max-w-4xl w-full">
            {activeTab === 'perfil' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {isProfileLoading ? (
                  <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-slate-400 animate-spin" /></div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <form onSubmit={handleSaveProfile} className="p-6 flex flex-col gap-6">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <div className="w-24 h-24 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer group relative" onClick={() => fileInputRef.current?.click()}>
                          {photoPreview ? (
                            <img src={photoPreview} alt="Perfil" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl font-bold text-slate-400">{(name || 'U').substring(0, 2).toUpperCase()}</span>
                          )}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Camera className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handlePhotoSelect} accept="image/*" className="hidden" />
                        <div className="flex-1 text-center sm:text-left pt-2">
                           <h4 className="text-sm font-semibold text-slate-800">Fotografia de Perfil</h4>
                           <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 inline-flex items-center justify-center rounded-md text-xs font-medium border border-slate-200 h-8 px-3 text-slate-700 hover:bg-slate-50 transition-colors">Alterar</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome</label>
                          <input type="text" value={name} onChange={e => setName(e.target.value)} required className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">E-mail</label>
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                        </div>
                      </div>
                      <div className="space-y-1 pt-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Senha (opcional)</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                      </div>
                      <div className="pt-4 flex justify-end">
                        <button type="submit" disabled={isSavingProfile} className="bg-slate-900 text-white px-6 h-10 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-70 flex items-center gap-2">
                          {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                          Guardar Alterações
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'conexoes' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6">
                {!selectedProvider ? (
                  <div onClick={() => setSelectedProvider('evolution')} className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 flex items-center gap-6 cursor-pointer hover:border-blue-400 transition-all group">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100 group-hover:scale-105 transition-transform">
                      <Smartphone className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-900">WhatsApp Oficial</h3>
                      <p className="text-sm text-slate-500">Gestão via Evolution API.</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1 rounded-md text-xs font-semibold">{instances.length} Instâncias</div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    <button onClick={() => setSelectedProvider(null)} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors w-fit flex items-center gap-1">
                      <ChevronLeft className="w-4 h-4" /> Voltar
                    </button>
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <form onSubmit={handleCreateInstance} className="p-6 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome Instância</label>
                          <input type="text" value={newInstanceName} onChange={e => setNewInstanceName(e.target.value)} required className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Proxy (Opcional)</label>
                          <select value={selectedProxyId} onChange={e => setSelectedProxyId(e.target.value)} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                            <option value="">Nenhum Proxy</option>
                            {availableProxies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <button type="submit" disabled={isCreatingInstance} className="md:col-span-2 bg-slate-900 text-white h-10 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                          {isCreatingInstance ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          Criar Instância
                        </button>
                      </form>
                      <div className="p-6">
                        {isInstancesLoading ? <div className="flex justify-center"><Loader2 className="w-6 h-6 text-slate-400 animate-spin" /></div> : (
                          <div className="flex flex-col gap-3">
                            {instances.map(inst => (
                              <div key={inst.id} className="border p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-sm">{inst.name}</h4>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${inst.status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{inst.status}</span>
                                  </div>
                                  <p className="text-xs text-slate-400 font-mono mt-1">{inst.id}</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  {inst.status !== 'connected' && <button onClick={() => handleConnectInstance(inst.name)} className="h-8 px-3 rounded-md border border-slate-200 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5"><QrCode className="w-3.5 h-3.5" /> Ligar</button>}
                                  <button onClick={() => handleDeleteInstance(inst.name)} className="h-8 px-3 rounded-md border border-slate-200 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Remover</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {qrCodeData && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={() => setQrCodeData(null)}>
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><QrCode className="w-5 h-5 text-blue-600" /> Ligar WhatsApp</h3>
            {qrCodeData.base64 && <img src={qrCodeData.base64.startsWith('data:') ? qrCodeData.base64 : `data:image/png;base64,${qrCodeData.base64}`} alt="QR Code" className="w-56 h-56 border p-2 rounded" />}
            <button onClick={() => setQrCodeData(null)} className="mt-6 w-full bg-slate-900 text-white h-10 rounded-md font-medium">Fechar</button>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={() => setConfirmModal(null)}>
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-slate-500 mb-6">{confirmModal.message}</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmModal(null)} className="flex-1 h-10 rounded-md border border-slate-200 text-sm font-medium hover:bg-slate-50">Cancelar</button>
              <button onClick={confirmModal.onConfirm} className="flex-1 h-10 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';

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
  const [user, setUser] = useState<any>(null);
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
          setUser(currentUser);
          setName(currentUser.name || '');
          setEmail(currentUser.email || '');
          if (currentUser.profilePictureUrl) {
            setPhotoPreview(currentUser.profilePictureUrl);
          }
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
    if (!user) return;
    
    setIsSavingProfile(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    if (password.trim() !== '') formData.append('password', password);
    if (photoFile) formData.append('file', photoFile);

    try {
      const res = await fetch(`${baseUrl}/users/${user.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (res.ok) {
        showFeedback('success', 'Perfil atualizado com sucesso! (Recarregue se a foto não mudar na hora)');
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
        const errorMessage = errorData?.message || "Erro desconhecido ao criar a instância. Verifique os dados.";
        showFeedback('error', errorMessage);
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
      message: "Tem a certeza que deseja excluir esta conexão? A sua comunicação com o WhatsApp será interrompida.",
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
        if (data.base64 || data.pairingCode) {
          setQrCodeData(data);
        } else {
          showFeedback('error', "Instância já conectada ou erro ao gerar código.");
        }
      } else {
        const errData = await res.json();
        showFeedback('error', errData.message || 'Não foi possível carregar o QR Code');
      }
    } catch (error) {
      showFeedback('error', "Erro ao conectar à Evolution API.");
    }
  };

  return (
    <div className="flex h-screen bg-[#f4f7f6] font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full overflow-hidden relative">
        
        {/* TOAST NOTIFICATION - CANTO SUPERIOR DIREITO */}
        {toast && (
          <div className={`fixed top-10 right-10 z-[9999] animate-in slide-in-from-top-5 fade-in duration-300`}>
            <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-white border-green-100 text-green-700' : 'bg-white border-red-100 text-red-700'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                {toast.type === 'success' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                )}
              </div>
              <span className="font-bold text-sm">{toast.message}</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            
            {/* CABEÇALHO INTEGRADO COM NAVEGAÇÃO DE ABAS */}
            <header className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Painel de Controlo</span>
                </div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Definições da Conta</h1>
                <p className="text-slate-500 mt-1 font-medium">Gira as suas preferências e conexões externas de API.</p>
              </div>
              
              {/* NAVEGAÇÃO POR ABAS (Segmented Control) */}
              <div className="inline-flex bg-slate-200/50 p-1.5 rounded-xl border border-slate-200/60 shadow-inner w-full sm:w-auto overflow-x-auto no-scrollbar">
                <button 
                  onClick={() => setActiveTab('perfil')}
                  className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-1 sm:flex-none ${activeTab === 'perfil' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                  Meu Perfil
                </button>
                <button 
                  onClick={() => setActiveTab('conexoes')}
                  className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-1 sm:flex-none ${activeTab === 'conexoes' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>
                  Conexões API
                </button>
              </div>
            </header>

            {/* ABA 1: MEU PERFIL */}
            {activeTab === 'perfil' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {isProfileLoading ? (
                  <div className="flex justify-center mt-20"><div className="w-10 h-10 border-4 border-[#1FA84A] border-t-transparent rounded-full animate-spin"></div></div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-8 md:p-10 max-w-3xl">

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-10">
                      <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-32 h-32 rounded-full bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden relative transition-all group-hover:shadow-md group-hover:border-[#1FA84A]/50">
                          {photoPreview ? (
                            <img src={photoPreview} alt="Perfil" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-4xl font-extrabold text-slate-400">{(name || 'U').substring(0, 2).toUpperCase()}</span>
                          )}
                          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" /></svg>
                          </div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handlePhotoSelect} accept="image/*" className="hidden" />
                      </div>
                      <div className="flex-1 w-full text-center sm:text-left">
                         <h2 className="text-xl font-extrabold text-slate-800 mb-1">Fotografia de Perfil</h2>
                         <p className="text-sm text-slate-500 font-medium mb-4">Recomendamos uma imagem quadrada com pelo menos 400x400px.</p>
                         <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-colors border border-slate-200/60 shadow-sm">Escolher Nova Imagem</button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Nome Completo</label>
                          <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-800 outline-none focus:bg-white focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">E-mail</label>
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-800 outline-none focus:bg-white focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all shadow-sm" />
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-slate-100">
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Nova Senha <span className="text-slate-400 font-medium normal-case tracking-normal">(Deixe em branco para manter a atual)</span></label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-800 outline-none focus:bg-white focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all shadow-sm" />
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button type="submit" disabled={isSavingProfile} className="bg-[#1FA84A] text-white px-8 py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg hover:bg-green-600 transition-all flex items-center justify-center gap-2 min-w-[180px]">
                        {isSavingProfile ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Salvar Alterações'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ABA 2: CONEXÕES API (Evolution) */}
            {activeTab === 'conexoes' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {!selectedProvider ? (
                  <div>
                    <h2 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">Provedores Disponíveis</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div onClick={() => setSelectedProvider('evolution')} className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-[#1FA84A]/50 cursor-pointer transition-all flex flex-col items-center text-center group">
                        <div className="w-24 h-24 bg-gradient-to-br from-green-50 to-[#e8f6ea] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner border border-[#1FA84A]/10">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-[#1FA84A]"><path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" /></svg>
                        </div>
                        <h3 className="font-extrabold text-xl text-slate-800">WhatsApp Oficial</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">Conexão via Evolution API</p>
                        <div className="mt-6 bg-slate-50 border border-slate-100 text-slate-600 px-5 py-2 rounded-full text-xs font-bold shadow-sm">{instances.length} Instância(s) criadas</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-right-4">
                    <button onClick={() => setSelectedProvider(null)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold bg-white px-5 py-2.5 border border-slate-200/80 rounded-xl shadow-sm w-fit transition-colors text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                      Voltar aos Provedores
                    </button>

                    <div className="bg-white border border-slate-200/80 rounded-3xl p-8 md:p-10 shadow-sm">
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Instâncias do WhatsApp</h2>
                          <p className="text-sm text-slate-500 font-medium mt-1">Crie e conecte os seus números de telemóvel à plataforma.</p>
                        </div>
                      </div>

                      {/* Criar Instância */}
                      <form onSubmit={handleCreateInstance} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/80 mb-10 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                          <div className="flex-1 w-full">
                            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Nome da Instância</label>
                            <input 
                              type="text" 
                              value={newInstanceName} 
                              onChange={e => setNewInstanceName(e.target.value)} 
                              placeholder="Ex: SuportePrincipal (Sem espaços)" 
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-800 outline-none focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all shadow-sm"
                              required
                            />
                          </div>
                          
                          <div className="flex-1 w-full">
                            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Conexão Proxy</label>
                            <div className="relative">
                              <select 
                                value={selectedProxyId} 
                                onChange={e => setSelectedProxyId(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-800 outline-none focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all shadow-sm appearance-none cursor-pointer"
                              >
                                <option value="">Conexão Direta (Sem Proxy)</option>
                                {availableProxies.map(proxy => (
                                  <option key={proxy.id} value={proxy.id}>
                                    {proxy.name} ({proxy.host}:{proxy.port})
                                  </option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                              </div>
                            </div>
                          </div>

                          <button type="submit" disabled={isCreatingInstance} className="bg-[#1FA84A] text-white px-8 py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg hover:bg-green-600 transition-all flex items-center justify-center gap-2 w-full md:w-auto h-[50px] shrink-0">
                            {isCreatingInstance ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>}
                            Adicionar
                          </button>
                        </div>
                      </form>

                      {/* Lista de Instâncias */}
                      {isInstancesLoading ? (
                        <div className="flex justify-center py-10"><div className="w-10 h-10 border-4 border-[#1FA84A] border-t-transparent rounded-full animate-spin"></div></div>
                      ) : instances.length === 0 ? (
                        <div className="text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-slate-300 mx-auto mb-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
                          <p className="text-slate-500 font-bold text-lg">Nenhuma instância cadastrada.</p>
                          <p className="text-slate-400 text-sm mt-1">Preencha o formulário acima para criar a sua primeira conexão.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {instances.map(inst => (
                            <div key={inst.id} className={`border p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all shadow-sm ${inst.status === 'connected' ? 'bg-white border-green-200/60' : 'bg-slate-50 border-slate-200'}`}>
                              <div className="flex gap-4 items-center w-full md:w-auto">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-inner ${inst.status === 'connected' ? 'bg-[#e8f6ea] text-[#1FA84A]' : 'bg-slate-200 text-slate-500'}`}>
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" /></svg>
                                </div>
                                <div>
                                  <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-extrabold text-lg text-slate-800">{inst.name}</h3>
                                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-widest border ${inst.status === 'connected' ? 'bg-green-50 text-[#1FA84A] border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                      {inst.status === 'connected' ? 'Conectado' : 'Aguardando'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <p className="text-[11px] text-slate-400 font-mono font-medium">{inst.id}</p>
                                    {(inst.proxyHost || inst.proxyPort) && (
                                      <>
                                        <span className="text-[10px] text-slate-300">•</span>
                                        <p className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
                                          Proxy: {inst.proxyHost}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex gap-2 w-full md:w-auto shrink-0">
                                {inst.status !== 'connected' && (
                                  <button onClick={() => handleConnectInstance(inst.name)} className="flex-1 md:flex-none bg-blue-50 text-blue-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-600 hover:text-white transition-colors shadow-sm">
                                    Ler QR Code
                                  </button>
                                )}
                                <button onClick={() => handleDeleteInstance(inst.name)} className="flex-1 md:flex-none bg-white border border-slate-200 text-red-500 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm">
                                  Remover
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>

      {/* MODAL DO QR CODE */}
      {qrCodeData && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => {setQrCodeData(null); fetchInstances();}}>
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center text-center animate-in zoom-in-95 duration-200 border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-[#e8f6ea] text-[#1FA84A] rounded-full flex items-center justify-center mb-6 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" /></svg>
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Conectar WhatsApp</h3>
            <p className="text-[15px] font-medium text-slate-500 mb-8 leading-relaxed">Abra o seu WhatsApp no telemóvel, vá a Aparelhos Conectados e leia o código abaixo.</p>
            
            {qrCodeData.base64 && (
              <div className="border border-slate-200 rounded-3xl overflow-hidden p-3 bg-white shadow-sm mb-8">
                <img src={qrCodeData.base64.startsWith('data:') ? qrCodeData.base64 : `data:image/png;base64,${qrCodeData.base64}`} alt="QR Code" className="w-56 h-56" />
              </div>
            )}
            
            <button onClick={() => {setQrCodeData(null); fetchInstances();}} className="w-full bg-slate-100 text-slate-600 py-3.5 rounded-xl font-bold hover:bg-slate-200 hover:text-slate-800 transition-colors text-sm">
              Fechar Janela
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO GERAL */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setConfirmModal(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="p-8 text-center bg-gradient-to-b from-white to-slate-50">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">{confirmModal.title}</h3>
              <p className="text-[15px] font-medium text-slate-500 leading-relaxed px-2">{confirmModal.message}</p>
            </div>
            <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button onClick={() => setConfirmModal(null)} className="flex-1 px-5 py-3.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors text-sm">Cancelar</button>
              <button onClick={confirmModal.onConfirm} className="flex-1 bg-red-500 text-white px-5 py-3.5 rounded-xl font-bold text-sm hover:bg-red-600 transition-all shadow-md">Sim, Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
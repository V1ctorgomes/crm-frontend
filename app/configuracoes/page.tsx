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

  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [instances, setInstances] = useState<Instance[]>([]);
  const [isInstancesLoading, setIsInstancesLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  
  const [newInstanceName, setNewInstanceName] = useState('');
  const [useProxy, setUseProxy] = useState(false);
  const [proxyHost, setProxyHost] = useState('');
  const [proxyPort, setProxyPort] = useState('');
  const [proxyUser, setProxyUser] = useState('');
  const [proxyPass, setProxyPass] = useState('');
  const [proxyProto, setProxyProto] = useState('http');

  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{ base64?: string; pairingCode?: string } | null>(null);

  useEffect(() => {
    fetchUserData();
    fetchInstances();
  }, []);

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
          if (currentUser.profilePictureUrl) setPhotoPreview(currentUser.profilePictureUrl);
        }
      }
    } catch (error) {
      setProfileMessage({ type: 'error', text: 'Erro ao carregar utilizador.' });
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
    setProfileMessage(null);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    if (password.trim() !== '') formData.append('password', password);
    if (photoFile) formData.append('file', photoFile);

    try {
      const res = await fetch(`${baseUrl}/users/${user.id}`, { method: 'PUT', body: formData });
      if (res.ok) {
        setProfileMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        setPassword('');
      } else {
        setProfileMessage({ type: 'error', text: 'Falha ao atualizar perfil.' });
      }
    } catch (error) {
      setProfileMessage({ type: 'error', text: 'Erro de ligação.' });
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
          const res = await fetch(`${baseUrl}/instances/user/${users[0].id}`);
          if (res.ok) setInstances(await res.json());
        }
      }
    } catch (error) {
      console.error('Erro instâncias', error);
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
      const payload: any = { name: newInstanceName, userId: users[0].id };
      if (useProxy) {
        payload.proxyHost = proxyHost; payload.proxyPort = proxyPort;
        payload.proxyUser = proxyUser; payload.proxyPass = proxyPass;
        payload.proxyProto = proxyProto;
      }
      const res = await fetch(`${baseUrl}/instances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setNewInstanceName(''); setUseProxy(false);
        await fetchInstances();
      } else {
        alert("Erro ao criar instância.");
      }
    } catch (error) {
      alert("Erro de conexão.");
    } finally {
      setIsCreatingInstance(false);
    }
  };

  const handleDeleteInstance = async (instanceName: string) => {
    if (!confirm("Excluir instância?")) return;
    try {
      await fetch(`${baseUrl}/instances/${instanceName}`, { method: 'DELETE' });
      await fetchInstances();
    } catch (error) { console.error(error); }
  };

  const handleConnectInstance = async (name: string) => {
    try {
      const res = await fetch(`${baseUrl}/instances/connect/${name}`);
      if (res.ok) {
        const data = await res.json();
        if (data.base64) {
          setQrCodeData(data);
        } else {
          alert("Instância já conectada ou aguarde um momento.");
        }
      } else {
        const errData = await res.json();
        alert(`Erro: ${errData.message || 'Não foi possível carregar o QR Code'}`);
      }
    } catch (error) {
      alert("Erro ao conectar à Evolution API.");
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full overflow-y-auto">
        <div className="h-[76px] bg-white border-b border-slate-200 flex items-end px-8 shrink-0 shadow-sm z-10 gap-8">
          <button onClick={() => setActiveTab('perfil')} className={`pb-4 font-bold text-[15px] border-b-[3px] transition-colors ${activeTab === 'perfil' ? 'border-[#1FA84A] text-[#1FA84A]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Meu Perfil</button>
          <button onClick={() => setActiveTab('conexoes')} className={`pb-4 font-bold text-[15px] border-b-[3px] transition-colors ${activeTab === 'conexoes' ? 'border-[#1FA84A] text-[#1FA84A]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Conexões API</button>
        </div>

        <div className="p-8 max-w-4xl mx-auto w-full">
          {activeTab === 'perfil' && (
            <div className="animate-in fade-in">
              {isProfileLoading ? (
                <div className="flex justify-center mt-20"><div className="w-8 h-8 border-4 border-[#1FA84A] border-t-transparent rounded-full animate-spin"></div></div>
              ) : (
                <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
                  {profileMessage && <div className={`mb-6 p-4 rounded-xl font-medium text-sm ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>{profileMessage.text}</div>}
                  <div className="flex flex-col items-center mb-8">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className="w-28 h-28 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden relative">
                        {photoPreview ? <img src={photoPreview} alt="Perfil" className="w-full h-full object-cover" /> : <span className="text-4xl font-bold text-slate-300">{(name || 'U').substring(0, 1).toUpperCase()}</span>}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /></svg></div>
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handlePhotoSelect} accept="image/*" className="hidden" />
                    </div>
                  </div>
                  <div className="space-y-5">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome" className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#1FA84A]" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#1FA84A]" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Nova Senha (opcional)" className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#1FA84A]" />
                  </div>
                  <div className="mt-8 flex justify-end"><button type="submit" className="bg-[#1FA84A] text-white px-8 py-3 rounded-xl font-bold">{isSavingProfile ? 'Salvando...' : 'Salvar Alterações'}</button></div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'conexoes' && (
            <div className="animate-in fade-in">
              {!selectedProvider ? (
                <div onClick={() => setSelectedProvider('evolution')} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-[#1FA84A] cursor-pointer transition-all flex flex-col items-center">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#1FA84A]"><path d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" /></svg></div>
                  <h3 className="font-bold text-lg">WhatsApp Oficial</h3>
                  <p className="text-sm text-slate-500">Evolution API v2</p>
                </div>
              ) : (
                <div className="animate-in slide-in-from-right-4">
                  <button onClick={() => setSelectedProvider(null)} className="mb-6 font-bold text-slate-500 flex items-center gap-2 underline">Voltar</button>
                  <div className="bg-white border border-slate-200 rounded-2xl p-8">
                    <form onSubmit={handleCreateInstance} className="space-y-4 mb-8">
                      <input type="text" value={newInstanceName} onChange={e => setNewInstanceName(e.target.value)} placeholder="Nome da Instância" className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none" required />
                      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={useProxy} onChange={e => setUseProxy(e.target.checked)} /> <span className="text-sm font-bold">Usar Proxy</span></label>
                      {useProxy && (
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border">
                          <input type="text" placeholder="Host" value={proxyHost} onChange={e => setProxyHost(e.target.value)} className="w-full p-2 border rounded" />
                          <input type="text" placeholder="Porta" value={proxyPort} onChange={e => setProxyPort(e.target.value)} className="w-full p-2 border rounded" />
                          <input type="text" placeholder="Usuário" value={proxyUser} onChange={e => setProxyUser(e.target.value)} className="w-full p-2 border rounded" />
                          <input type="password" placeholder="Senha" value={proxyPass} onChange={e => setProxyPass(e.target.value)} className="w-full p-2 border rounded" />
                        </div>
                      )}
                      <button type="submit" className="bg-[#1FA84A] text-white px-6 py-2 rounded-xl font-bold w-full">{isCreatingInstance ? 'Criando...' : 'Criar Instância'}</button>
                    </form>
                    <div className="space-y-4">
                      {instances.map(inst => (
                        <div key={inst.id} className="border p-4 rounded-xl flex items-center justify-between">
                          <div><h4 className="font-bold">{inst.name}</h4><span className="text-xs uppercase font-bold text-slate-400">{inst.status}</span></div>
                          <div className="flex gap-2">
                            {inst.status !== 'connected' && <button onClick={() => handleConnectInstance(inst.name)} className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm">QR Code</button>}
                            <button onClick={() => handleDeleteInstance(inst.name)} className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm">Excluir</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {qrCodeData && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center" onClick={() => setQrCodeData(null)}>
          <div className="bg-white p-8 rounded-2xl text-center max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Conectar WhatsApp</h3>
            {qrCodeData.base64 && <img src={qrCodeData.base64.startsWith('data:') ? qrCodeData.base64 : `data:image/png;base64,${qrCodeData.base64}`} alt="QR Code" className="w-64 h-64 mx-auto mb-6" />}
            <button onClick={() => setQrCodeData(null)} className="bg-slate-200 px-6 py-2 rounded-xl font-bold w-full">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
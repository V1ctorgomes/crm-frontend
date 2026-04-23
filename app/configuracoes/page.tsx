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
  const [profileMessage, setProfileMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ================= ESTADOS DAS CONEXÕES =================
  const [instances, setInstances] = useState<Instance[]>([]);
  const [isInstancesLoading, setIsInstancesLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  
  // Campos de Criação de Instância (Incluindo Proxy)
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

  // --- Funções do Perfil ---
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
      setProfileMessage({ type: 'error', text: 'Erro ao carregar dados do utilizador.' });
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
      const res = await fetch(`${baseUrl}/users/${user.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (res.ok) {
        setProfileMessage({ type: 'success', text: 'Perfil atualizado com sucesso! (Recarregue a página se a foto da barra lateral não atualizar instantaneamente)' });
        setPassword('');
      } else {
        setProfileMessage({ type: 'error', text: 'Falha ao atualizar perfil.' });
      }
    } catch (error) {
      setProfileMessage({ type: 'error', text: 'Erro de ligação ao servidor.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // --- Funções das Instâncias ---
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
      
      if (useProxy) {
        payload.proxyHost = proxyHost;
        payload.proxyPort = proxyPort;
        payload.proxyUser = proxyUser;
        payload.proxyPass = proxyPass;
        payload.proxyProto = proxyProto;
      }

      const res = await fetch(`${baseUrl}/instances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setNewInstanceName('');
        setUseProxy(false);
        setProxyHost('');
        setProxyPort('');
        setProxyUser('');
        setProxyPass('');
        await fetchInstances();
      } else {
        alert("Erro ao criar a instância. O nome pode já estar em uso.");
      }
    } catch (error) {
      alert("Erro de conexão.");
    } finally {
      setIsCreatingInstance(false);
    }
  };

  const handleDeleteInstance = async (instanceName: string) => {
    if (!confirm("Tem a certeza que deseja excluir esta instância?")) return;
    try {
      await fetch(`${baseUrl}/instances/${instanceName}`, { method: 'DELETE' });
      await fetchInstances();
    } catch (error) {
      console.error(error);
    }
  };

  const handleConnectInstance = async (name: string) => {
    try {
      const res = await fetch(`${baseUrl}/instances/connect/${name}`);
      if (res.ok) {
        const data = await res.json();
        if (data.base64 || data.pairingCode) {
          setQrCodeData(data);
        } else {
          alert("Instância já conectada ou erro ao gerar código.");
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
          <button 
            onClick={() => setActiveTab('perfil')}
            className={`pb-4 font-bold text-[15px] border-b-[3px] transition-colors ${activeTab === 'perfil' ? 'border-[#1FA84A] text-[#1FA84A]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            Meu Perfil
          </button>
          <button 
            onClick={() => setActiveTab('conexoes')}
            className={`pb-4 font-bold text-[15px] border-b-[3px] transition-colors ${activeTab === 'conexoes' ? 'border-[#1FA84A] text-[#1FA84A]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            Conexões API
          </button>
        </div>

        <div className="p-8 max-w-4xl mx-auto w-full">
          
          {/* ABA 1: MEU PERFIL */}
          {activeTab === 'perfil' && (
            <div className="animate-in fade-in">
              {isProfileLoading ? (
                <div className="flex justify-center mt-20"><div className="w-8 h-8 border-4 border-[#1FA84A] border-t-transparent rounded-full animate-spin"></div></div>
              ) : (
                <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
                  
                  {profileMessage && (
                    <div className={`mb-6 p-4 rounded-xl font-medium text-sm ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                      {profileMessage.text}
                    </div>
                  )}

                  <div className="flex flex-col items-center mb-8">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className="w-28 h-28 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden relative">
                        {photoPreview ? (
                          <img src={photoPreview} alt="Perfil" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-4xl font-bold text-slate-300">{(name || 'U').substring(0, 1).toUpperCase()}</span>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" /></svg>
                        </div>
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handlePhotoSelect} accept="image/*" className="hidden" />
                    </div>
                    <span className="text-xs text-slate-500 mt-3 font-medium">Clique na foto para alterar</span>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1FA84A] bg-slate-50 focus:bg-white transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">E-mail</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1FA84A] bg-slate-50 focus:bg-white transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Nova Senha <span className="text-slate-400 font-normal">(Deixe em branco para manter a atual)</span></label>
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1FA84A] bg-slate-50 focus:bg-white transition-colors" />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button type="submit" disabled={isSavingProfile} className="bg-[#1FA84A] text-white px-8 py-3 rounded-xl font-bold shadow-sm hover:bg-green-600 transition-colors flex items-center gap-2">
                      {isSavingProfile && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                      {isSavingProfile ? 'A Guardar...' : 'Salvar Alterações'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ABA 2: CONEXÕES API (Evolution) */}
          {activeTab === 'conexoes' && (
            <div className="animate-in fade-in">
              {!selectedProvider ? (
                <div>
                  <h2 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Provedores Disponíveis</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div onClick={() => setSelectedProvider('evolution')} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#1FA84A]/50 cursor-pointer transition-all flex flex-col items-center text-center group">
                      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-[#1FA84A]"><path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" /></svg>
                      </div>
                      <h3 className="font-bold text-lg text-slate-800">WhatsApp Oficial</h3>
                      <p className="text-sm text-slate-500 mt-1">Evolution API</p>
                      <div className="mt-4 bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full text-xs font-bold">{instances.length} Instância(s) criadas</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <button onClick={() => setSelectedProvider(null)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold bg-white px-4 py-2 border border-slate-200 rounded-xl shadow-sm w-fit transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                    Voltar aos Provedores
                  </button>

                  <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h2 className="text-xl font-bold text-slate-800">Instâncias do WhatsApp</h2>
                        <p className="text-sm text-slate-500">Conecte e faça a gestão dos seus números através da Evolution API.</p>
                      </div>
                    </div>

                    <form onSubmit={handleCreateInstance} className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
                      <div className="flex flex-col md:flex-row gap-4 items-end mb-4">
                        <div className="flex-1 w-full">
                          <label className="block text-sm font-bold text-slate-700 mb-2">Nome da Nova Instância (ex: SuportePrincipal)</label>
                          <input 
                            type="text" 
                            value={newInstanceName} 
                            onChange={e => setNewInstanceName(e.target.value)} 
                            placeholder="Sem espaços ou caracteres especiais" 
                            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1FA84A]"
                            required
                          />
                        </div>
                        <button type="submit" disabled={isCreatingInstance} className="bg-[#1FA84A] text-white px-8 py-3 rounded-xl font-bold shadow-sm hover:bg-green-600 transition-colors h-[46px] flex items-center gap-2 w-full md:w-auto justify-center">
                          {isCreatingInstance ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>}
                          Criar
                        </button>
                      </div>

                      {/* TOGGLE PROXY */}
                      <label className="flex items-center gap-2 cursor-pointer w-fit mb-4">
                        <input type="checkbox" className="hidden" checked={useProxy} onChange={(e) => setUseProxy(e.target.checked)} />
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${useProxy ? 'bg-[#1FA84A]' : 'bg-slate-300'}`}>
                          <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${useProxy ? 'left-6' : 'left-1'}`}></div>
                        </div>
                        <span className="text-sm font-bold text-slate-700 select-none">Usar Proxy (Opcional)</span>
                      </label>

                      {/* CAMPOS DE PROXY */}
                      {useProxy && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-white p-4 border border-slate-200 rounded-xl animate-in fade-in slide-in-from-top-2">
                          <div className="col-span-full md:col-span-2 lg:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Host do Proxy</label>
                            <input type="text" placeholder="192.168.1.1" value={proxyHost} onChange={e => setProxyHost(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1FA84A]" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Porta</label>
                            <input type="text" placeholder="8080" value={proxyPort} onChange={e => setProxyPort(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1FA84A]" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Protocolo</label>
                            <select value={proxyProto} onChange={e => setProxyProto(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1FA84A] bg-white">
                              <option value="http">HTTP</option>
                              <option value="https">HTTPS</option>
                              <option value="socks5">SOCKS5</option>
                            </select>
                          </div>
                          <div className="col-span-full md:col-span-1 lg:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Utilizador</label>
                            <input type="text" placeholder="user123" value={proxyUser} onChange={e => setProxyUser(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1FA84A]" />
                          </div>
                          <div className="col-span-full md:col-span-1 lg:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Senha</label>
                            <input type="password" placeholder="••••••••" value={proxyPass} onChange={e => setProxyPass(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1FA84A]" />
                          </div>
                        </div>
                      )}
                    </form>

                    {isInstancesLoading ? (
                      <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-[#1FA84A] border-t-transparent rounded-full animate-spin"></div></div>
                    ) : instances.length === 0 ? (
                      <div className="text-center p-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">Nenhuma instância cadastrada. Crie a sua primeira instância acima.</div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {instances.map(inst => (
                          <div key={inst.id} className="border border-slate-200 p-5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white hover:border-[#1FA84A]/30 transition-colors">
                            <div>
                              <div className="flex items-center gap-3">
                                <h3 className="font-bold text-lg text-slate-800">{inst.name}</h3>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${inst.status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {inst.status === 'connected' ? 'Conectado' : 'Desconectado'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1 font-mono">ID: {inst.id}</p>
                              {/* Mostra as credenciais de Proxy se existirem */}
                              {(inst.proxyHost || inst.proxyPort) && (
                                <p className="text-[11px] font-bold text-blue-500 mt-1 uppercase tracking-wider">
                                  PROXY ATIVO: {inst.proxyHost}:{inst.proxyPort}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex gap-2 w-full md:w-auto">
                              {inst.status !== 'connected' && (
                                <button onClick={() => handleConnectInstance(inst.name)} className="flex-1 md:flex-none bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-100 transition-colors">
                                  Ler QR Code
                                </button>
                              )}
                              <button onClick={() => handleDeleteInstance(inst.name)} className="flex-1 md:flex-none bg-red-50 text-red-500 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-100 transition-colors">
                                Excluir
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
      </main>

      {/* MODAL DO QR CODE */}
      {qrCodeData && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4" onClick={() => {setQrCodeData(null); fetchInstances();}}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center text-center animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Conectar WhatsApp</h3>
            <p className="text-sm text-slate-500 mb-6">Abra o seu WhatsApp no telemóvel e leia o código abaixo para conectar a instância.</p>
            
            {qrCodeData.base64 && (
              <div className="border-4 border-[#1FA84A] rounded-2xl overflow-hidden p-2 bg-white">
                <img src={qrCodeData.base64.startsWith('data:') ? qrCodeData.base64 : `data:image/png;base64,${qrCodeData.base64}`} alt="QR Code" className="w-56 h-56" />
              </div>
            )}
            
            <button onClick={() => {setQrCodeData(null); fetchInstances();}} className="mt-8 bg-slate-100 text-slate-600 px-6 py-2.5 rounded-xl font-bold w-full hover:bg-slate-200 transition-colors">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
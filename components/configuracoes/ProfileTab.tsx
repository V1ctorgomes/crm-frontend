import React from 'react';
import { Camera, Loader2 } from 'lucide-react';

interface ProfileTabProps {
  isProfileLoading: boolean;
  isSavingProfile: boolean;
  userData: any;
  name: string;
  setName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  photoPreview: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handlePhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveProfile: (e: React.FormEvent) => void;
}

export function ProfileTab({
  isProfileLoading, isSavingProfile, userData, name, setName, email, setEmail, password, setPassword,
  photoPreview, fileInputRef, handlePhotoSelect, handleSaveProfile
}: ProfileTabProps) {
  if (isProfileLoading) {
    return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-slate-400 animate-spin" /></div>;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-in fade-in duration-500">
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
          <button type="submit" disabled={isSavingProfile || !userData} className="bg-slate-900 text-white px-6 h-10 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-70 flex items-center gap-2 shadow-sm">
            {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar Alterações
          </button>
        </div>
      </form>
    </div>
  );
}
import React from 'react';

export type RecentMember = { id: string; name: string; profilePictureUrl: string | null };

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface LoginBannerProps {
  recentUsers?: RecentMember[];
}

export function LoginBanner({ recentUsers = [] }: LoginBannerProps) {
  /** Ordem visual: o mais recente à frente (direita) — invertemos o mais recente primeiro da API */
  const stack = [...recentUsers].slice(0, 3).reverse();
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center border-r border-brand-950">
      {/* Base verde profundo */}
      <div className="absolute inset-0 bg-brand-950 z-0" aria-hidden />
      {/* Gradiente principal: verde marca */}
      <div
        className="absolute inset-0 z-0 bg-gradient-to-br from-brand-600 via-brand-800 to-brand-950"
        aria-hidden
      />
      {/* Profundidade */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/35 via-transparent to-brand-500/10" aria-hidden />
      {/* Luz secundária: amarelo marca (canto) */}
      <div
        className="absolute bottom-[-12%] left-[-18%] w-[min(100vw,680px)] h-[min(100vw,680px)] rounded-full bg-highlight-warm/30 blur-[110px] z-0"
        aria-hidden
      />
      <div
        className="absolute top-[-18%] right-[-12%] w-[min(95vw,560px)] h-[min(95vw,560px)] rounded-full bg-brand-400/40 blur-[90px] z-0"
        aria-hidden
      />
      <div
        className="absolute top-1/3 right-1/4 w-[320px] h-[320px] rounded-full bg-highlight/15 blur-[80px] z-0"
        aria-hidden
      />

      <div className="relative z-10 flex flex-col p-16 max-w-2xl">
        <div className="w-16 h-16 bg-brand-800/50 backdrop-blur-md rounded-2xl flex items-center justify-center border border-highlight/35 mb-8 shadow-2xl shadow-brand-950/50">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-highlight">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
          </svg>
        </div>

        <h2 className="text-4xl font-bold text-white leading-tight mb-6 drop-shadow-sm">
          Otimizando a sua operação e unificando o atendimento ao cliente.
        </h2>

        <p className="text-lg text-brand-100/95 font-medium leading-relaxed max-w-lg">
          O nosso CRM consolida a sua gestão de processos, base de dados e WhatsApp numa interface rápida, moderna e intuitiva.
        </p>

        <div className="mt-12 flex items-center gap-4">
          {stack.length > 0 && (
            <div className="flex -space-x-3">
              {stack.map((u, i) => (
                <div
                  key={u.id}
                  style={{ zIndex: i + 1 }}
                  className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-brand-950 bg-brand-600"
                  title={u.name}
                >
                  {u.profilePictureUrl ? (
                    <img
                      src={u.profilePictureUrl}
                      alt={u.name}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center bg-brand-600 text-[10px] font-bold text-white"
                      aria-label={u.name}
                    >
                      {initials(u.name)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="text-sm font-medium text-highlight/90">Bem-vindo(a) à nossa equipe.</p>
        </div>
      </div>
    </div>
  );
}

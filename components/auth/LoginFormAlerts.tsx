import React from 'react';

interface LoginFormAlertsProps {
  error: string;
  registerSuccess: string;
  forgotSuccess: string;
}

/** Mensagens de sucesso/erro mostradas acima dos formulários de login. */
export function LoginFormAlerts({ error, registerSuccess, forgotSuccess }: LoginFormAlertsProps) {
  return (
    <>
      {(registerSuccess || forgotSuccess) && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 animate-in fade-in duration-300">
          <span className="text-sm font-medium leading-relaxed">{registerSuccess || forgotSuccess}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 animate-in fade-in duration-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5 shrink-0 mt-0.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="text-sm font-medium leading-relaxed">{error}</span>
        </div>
      )}
    </>
  );
}

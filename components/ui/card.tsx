import React from 'react';

export const Card = ({ children, className }: any) => (
  <div className={`rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm flex flex-col ${className || ''}`}>{children}</div>
);

export const CardHeader = ({ children, className }: any) => (
  <div className={`flex flex-col space-y-1.5 p-6 pb-4 ${className || ''}`}>{children}</div>
);

export const CardTitle = ({ children, className }: any) => (
  <h3 className={`font-semibold leading-none tracking-tight text-lg ${className || ''}`}>{children}</h3>
);

export const CardDescription = ({ children, className }: any) => (
  <p className={`text-sm text-slate-500 ${className || ''}`}>{children}</p>
);

export const CardContent = ({ children, className }: any) => (
  <div className={`p-6 pt-0 flex-1 ${className || ''}`}>{children}</div>
);
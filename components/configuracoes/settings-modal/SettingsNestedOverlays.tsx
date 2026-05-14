'use client';

import React from 'react';
import { AlertTriangle, QrCode } from 'lucide-react';
import type { SettingsConfirmState } from '../use-settings-modal';

type QrData = { base64?: string; pairingCode?: string } | null;

type SettingsNestedOverlaysProps = {
  qrCodeData: QrData;
  onCloseQr: () => void;
  confirmModal: SettingsConfirmState;
  onCloseConfirm: () => void;
};

export function SettingsNestedOverlays({
  qrCodeData,
  onCloseQr,
  confirmModal,
  onCloseConfirm,
}: SettingsNestedOverlaysProps) {
  return (
    <>
      {qrCodeData && (
        <div
          className="fixed inset-0 bg-brand-950/55 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onCloseQr}
        >
          <div
            className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-brand-600" /> Ligar WhatsApp
            </h3>
            {qrCodeData.base64 && (
              <img
                src={
                  qrCodeData.base64.startsWith('data:')
                    ? qrCodeData.base64
                    : `data:image/png;base64,${qrCodeData.base64}`
                }
                alt="QR Code"
                className="w-56 h-56 border p-2 rounded-lg"
              />
            )}
            <button
              type="button"
              onClick={onCloseQr}
              className="mt-6 w-full bg-brand-600 text-white h-10 rounded-md font-medium hover:bg-brand-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {confirmModal && (
        <div
          className="fixed inset-0 bg-brand-950/55 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onCloseConfirm}
        >
          <div
            className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4 bg-red-50 rounded-full p-2" />
            <h3 className="font-bold text-lg mb-2 text-brand-950">{confirmModal.title}</h3>
            <p className="text-sm text-slate-500 mb-6">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCloseConfirm}
                className="flex-1 h-10 rounded-md border border-slate-200 text-sm font-medium hover:bg-slate-50 text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmModal.onConfirm()}
                className="flex-1 h-10 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 shadow-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

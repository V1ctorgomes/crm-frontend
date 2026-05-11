'use client';

import { useEffect, useMemo, useRef } from 'react';

/** Safari / iOS não reproduzem WebM no <audio>; canPlayType fica vazio. */
function canBrowserPlayMime(mime?: string | null): boolean {
  if (typeof document === 'undefined') return true;
  const a = document.createElement('audio');
  const m = (mime || '').trim();
  if (!m.startsWith('audio/')) return true;
  const base = m.split(';')[0].trim();
  const candidates = [
    m,
    base,
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];
  for (const v of candidates) {
    if (!v) continue;
    const r = a.canPlayType(v);
    if (r === 'probably' || r === 'maybe') return true;
  }
  return false;
}

type VoiceNotePlayerProps = {
  src: string;
  mimeType?: string | null;
  className?: string;
  /** Balão verde (mensagens enviadas): controlos nativos em branco */
  invertControls?: boolean;
};

export function VoiceNotePlayer({ src, mimeType, className, invertControls }: VoiceNotePlayerProps) {
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const unmute = () => {
      el.muted = false;
      el.defaultMuted = false;
      if (el.volume === 0) el.volume = 1;
    };
    unmute();
    el.addEventListener('loadedmetadata', unmute);
    el.addEventListener('loadeddata', unmute);
    el.addEventListener('play', unmute);
    el.addEventListener('playing', unmute);
    return () => {
      el.removeEventListener('loadedmetadata', unmute);
      el.removeEventListener('loadeddata', unmute);
      el.removeEventListener('play', unmute);
      el.removeEventListener('playing', unmute);
    };
  }, [src]);

  const playable = useMemo(() => canBrowserPlayMime(mimeType), [mimeType]);

  if (!playable) {
    return (
      <div className={`flex flex-col gap-1 ${className ?? ''}`}>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-xs font-semibold underline ${invertControls ? 'text-white' : 'text-brand-700'}`}
        >
          Abrir áudio
        </a>
        <span className={`text-[10px] leading-snug ${invertControls ? 'text-white/80' : 'text-slate-500'}`}>
          WebM muitas vezes não toca no Safari — use «Abrir áudio» ou grave com Chrome/Edge (AAC).
        </span>
      </div>
    );
  }

  return (
    <audio
      ref={ref}
      key={src}
      src={src}
      controls
      muted={false}
      preload="auto"
      playsInline
      className={`block h-10 w-full max-w-full outline-none ${className ?? ''}`}
    />
  );
}

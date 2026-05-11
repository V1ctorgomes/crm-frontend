const FAVICON_SELECTOR = 'link[data-crm-favicon="dynamic"]';
/** Ícone padrão da app (sidebar / metadata). */
export const DEFAULT_TAB_ICON_PATH = '/icon.png';

function getOrCreateDynamicFaviconLink(): HTMLLinkElement {
  let link = document.querySelector(FAVICON_SELECTOR) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.setAttribute('data-crm-favicon', 'dynamic');
    document.head.appendChild(link);
  }
  return link;
}

/** Ícone de carta + bolinha verde (aba em segundo plano com mensagem nova). */
function drawLetterWithBadgeDataUrl(): string {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new URL(DEFAULT_TAB_ICON_PATH, window.location.origin).href;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  const pad = 5;
  const topY = 9;
  const foldY = 17;
  const botY = 25;

  // Corpo do envelope
  ctx.beginPath();
  ctx.moveTo(pad, topY);
  ctx.lineTo(pad, botY);
  ctx.lineTo(size - pad, botY);
  ctx.lineTo(size - pad, topY);
  ctx.closePath();
  ctx.fillStyle = '#f1f5f9';
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.25;
  ctx.stroke();

  // Aba superior (dobra em V)
  ctx.beginPath();
  ctx.moveTo(pad, topY);
  ctx.lineTo(size / 2, foldY);
  ctx.lineTo(size - pad, topY);
  ctx.closePath();
  ctx.fillStyle = '#e2e8f0';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.1;
  ctx.stroke();

  // Contorno da aba por cima do corpo
  ctx.beginPath();
  ctx.moveTo(pad, topY);
  ctx.lineTo(size / 2, foldY);
  ctx.lineTo(size - pad, topY);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.stroke();

  // “Fenda” da carta (linha curta)
  ctx.beginPath();
  ctx.moveTo(size / 2 - 4, foldY + 2);
  ctx.lineTo(size / 2 + 4, foldY + 2);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Bolinha verde (notificação)
  const cx = size - 6;
  const cy = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
  ctx.fillStyle = '#10b981';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

/** Com a aba em segundo plano: favicon = carta + bolinha verde. */
export function applyTabFaviconBadgeIfHidden(): void {
  if (typeof document === 'undefined' || !document.hidden) return;
  try {
    const href = drawLetterWithBadgeDataUrl();
    getOrCreateDynamicFaviconLink().href = href;
  } catch {
    /* ignore */
  }
}

/** Volta ao ícone padrão (`icon.png`) ao focar a aba. */
export function resetTabFaviconToDefault(): void {
  if (typeof document === 'undefined') return;
  document.querySelector(FAVICON_SELECTOR)?.remove();
}

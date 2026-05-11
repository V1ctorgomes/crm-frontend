const FAVICON_SELECTOR = 'link[data-crm-favicon="dynamic"]';

/** Ícone padrão da app (`public/icon.png` / `app/icon.png`). */
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

/** Favicon mínimo: só a bolinha verde (mensagem nova com a aba em segundo plano). */
function drawGreenDotOnlyDataUrl(): string {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new URL(DEFAULT_TAB_ICON_PATH, window.location.origin).href;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  const cx = size - 7;
  const cy = 7;
  ctx.beginPath();
  ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);
  ctx.fillStyle = '#10b981';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

/** Com a aba em segundo plano: favicon = apenas bolinha verde. */
export function applyTabFaviconBadgeIfHidden(): void {
  if (typeof document === 'undefined' || !document.hidden) return;
  try {
    getOrCreateDynamicFaviconLink().href = drawGreenDotOnlyDataUrl();
  } catch {
    /* ignore */
  }
}

/** Volta ao ícone padrão ao focar a aba. */
export function resetTabFaviconToDefault(): void {
  if (typeof document === 'undefined') return;
  document.querySelector(FAVICON_SELECTOR)?.remove();
}

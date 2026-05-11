const FAVICON_SELECTOR = 'link[data-crm-favicon="dynamic"]';

/** Ícone padrão da app (sidebar / `public/icon.png`). */
export const DEFAULT_TAB_ICON_PATH = '/icon.png';

/**
 * Bootstrap Icons — `envelope-fill` (MIT, https://github.com/twbs/icons).
 * Desenhado em canvas com bolinha de notificação.
 */
const BI_ENVELOPE_FILL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="#334155" d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697ZM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757Zm3.436-.586L16 11.801V4.697l-5.803 3.546Z"/></svg>`;

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

function drawBootstrapLetterWithBadgeDataUrl(): Promise<string> {
  const size = 32;
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(BI_ENVELOPE_FILL_SVG)}`;

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(new URL(DEFAULT_TAB_ICON_PATH, window.location.origin).href);
      return;
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const scale = 0.72;
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      const x = (size - w) / 2;
      const y = (size - h) / 2 + 1;
      ctx.drawImage(img, x, y, w, h);

      const cx = size - 6;
      const cy = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(new URL(DEFAULT_TAB_ICON_PATH, window.location.origin).href);
    img.src = src;
  });
}

/** Com a aba em segundo plano: favicon = ícone Bootstrap envelope-fill + bolinha verde. */
export async function applyTabFaviconBadgeIfHidden(): Promise<void> {
  if (typeof document === 'undefined' || !document.hidden) return;
  try {
    const href = await drawBootstrapLetterWithBadgeDataUrl();
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

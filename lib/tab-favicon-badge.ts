const FAVICON_SELECTOR = 'link[data-crm-favicon="dynamic"]';
const ICON_PATH = '/icon.png';

let cachedIconEl: HTMLImageElement | null = null;

function loadSidebarIcon(): Promise<HTMLImageElement> {
  if (cachedIconEl?.complete && cachedIconEl.naturalWidth > 0) {
    return Promise.resolve(cachedIconEl);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      cachedIconEl = img;
      resolve(img);
    };
    img.onerror = () => reject(new Error('favicon base image'));
    img.src = ICON_PATH;
  });
}

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

function drawBadgedPngDataUrl(img: HTMLImageElement): string {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new URL(ICON_PATH, window.location.origin).href;

  const scale = Math.max(size / img.width, size / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (size - w) / 2;
  const y = (size - h) / 2;
  ctx.drawImage(img, x, y, w, h);

  const cx = size - 6;
  const cy = 6;
  const r = 5.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#10b981';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

/** Quando a aba está em segundo plano, mostra bolinha no favicon (imagem da sidebar). */
export async function applyTabFaviconBadgeIfHidden(): Promise<void> {
  if (typeof document === 'undefined' || !document.hidden) return;
  try {
    const img = await loadSidebarIcon();
    const href = drawBadgedPngDataUrl(img);
    getOrCreateDynamicFaviconLink().href = href;
  } catch {
    /* ignore */
  }
}

/** Volta ao ícone normal ao focar a aba. */
export function resetTabFaviconToDefault(): void {
  if (typeof document === 'undefined') return;
  const href = new URL(ICON_PATH, window.location.origin).href;
  const link = document.querySelector(FAVICON_SELECTOR) as HTMLLinkElement | null;
  if (link) link.href = href;
}

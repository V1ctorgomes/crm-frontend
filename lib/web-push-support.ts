export type WebPushBlockReason =
  | 'ok'
  | 'no-core-apis'
  | 'ios-requires-home-screen'
  | 'in-app-browser';

export type WebPushBlockInfo = {
  reason: WebPushBlockReason;
  /** Se o fluxo `ensureWebPushSubscription` pode ser tentado com sucesso esperado */
  canTrySubscribe: boolean;
  hintTitle: string;
  hintBody: string;
};

function isIosLike(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iP(hone|od)/i.test(ua)) return true;
  // iPadOS 13+ pode reportar como Mac com touch
  if (/iPad/i.test(ua)) return true;
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return true;
  return false;
}

function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
  } catch {
    /* ignore */
  }
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

function isLikelyInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/(FBAN|FBAV|FB_IAB|Instagram|Line\/|Snapchat|TikTok|Twitter|LinkedInApp)/i.test(ua)) {
    return true;
  }
  if (/; wv\)/.test(ua) && /Android/i.test(ua)) return true;
  return false;
}

function hasCoreWebPushApis(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Explica por que o push pode falhar no telemóvel (iOS = PWA no ecrã inicial; browsers embutidos).
 */
export function getWebPushBlockInfo(): WebPushBlockInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      reason: 'no-core-apis',
      canTrySubscribe: false,
      hintTitle: 'Indisponível',
      hintBody: 'Ambiente sem APIs de notificação.',
    };
  }

  if (isLikelyInAppBrowser()) {
    return {
      reason: 'in-app-browser',
      canTrySubscribe: false,
      hintTitle: 'Browser embutido',
      hintBody:
        'Abra o CRM no Safari ou no Chrome (use «Abrir no browser» ou copie o link). Os browsers dentro do Instagram, Facebook ou WhatsApp não permitem notificações push.',
    };
  }

  const ios = isIosLike();
  const standalone = isStandalonePwa();

  if (ios && !standalone) {
    return {
      reason: 'ios-requires-home-screen',
      canTrySubscribe: false,
      hintTitle: 'iPhone / iPad',
      hintBody:
        'No iOS, as notificações push do site só funcionam com a app na página inicial: toque em Partilhar (□↑) → «Adicionar ao ecrã inicial» → abra o CRM pelo novo ícone. Requer iOS 16.4 ou superior. No Safari normal (só no separador) o sistema não envia push.',
    };
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return {
      reason: 'no-core-apis',
      canTrySubscribe: false,
      hintTitle: 'Browser sem suporte',
      hintBody:
        'Este browser não inclui Service Worker / Push. Use a versão atual do Chrome ou Safari.',
    };
  }

  if (!('Notification' in window)) {
    return {
      reason: 'no-core-apis',
      canTrySubscribe: false,
      hintTitle: 'Notificações indisponíveis',
      hintBody:
        'Neste modo o sistema não expõe notificações. No iPhone, adicione o CRM ao ecrã inicial e abra pelo ícone; no Android, abra no Chrome em vez do browser da app.',
    };
  }

  return {
    reason: 'ok',
    canTrySubscribe: true,
    hintTitle: '',
    hintBody: '',
  };
}

const PUSH_STATE_EVENT = 'crm-web-push-state';

export function notifyWebPushStateChanged(): void {
  if (typeof window === 'undefined') return;
  const run = () => {
    try {
      window.dispatchEvent(new CustomEvent(PUSH_STATE_EVENT));
    } catch {
      /* listener externo não deve rebentar o fluxo de subscrição */
    }
  };
  if (typeof queueMicrotask === 'function') queueMicrotask(run);
  else setTimeout(run, 0);
}

export function subscribeWebPushState(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener(PUSH_STATE_EVENT, listener);
  return () => window.removeEventListener(PUSH_STATE_EVENT, listener);
}

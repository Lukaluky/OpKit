const TOKEN_KEY = 'token';
const channel =
  typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('opkit-auth')
    : null;

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  channel?.postMessage({ type: 'login', token });
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  channel?.postMessage({ type: 'logout' });
}

export function initCanonicalHost(): void {
  if (window.location.hostname === '127.0.0.1') {
    const url = new URL(window.location.href);
    url.hostname = 'localhost';
    window.location.replace(url.toString());
  }
}

export function onAuthChange(handler: (token: string | null) => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === TOKEN_KEY) {
      handler(e.newValue);
    }
  };

  const onMessage = (e: MessageEvent) => {
    if (e.data?.type === 'login') {
      handler(e.data.token);
    }
    if (e.data?.type === 'logout') {
      handler(null);
    }
  };

  window.addEventListener('storage', onStorage);
  channel?.addEventListener('message', onMessage);

  return () => {
    window.removeEventListener('storage', onStorage);
    channel?.removeEventListener('message', onMessage);
  };
}

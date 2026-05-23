export function getApiUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}

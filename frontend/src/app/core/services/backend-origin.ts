const LOOPBACK_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]'
]);

const LOCAL_BACKEND = 'http://localhost:8080';

function currentHostname(): string {
  if (typeof window === 'undefined') {
    return 'localhost';
  }
  return window.location.hostname;
}

/** Returns the origin (protocol + host) for the backend API. */
export function backendOrigin(): string {
  const hostname = currentHostname();
  if (LOOPBACK_HOSTS.has(hostname)) {
    return LOCAL_BACKEND;
  }
  if (typeof window === 'undefined') {
    return LOCAL_BACKEND;
  }
  return window.location.origin;
}

/** Helper to build a fully qualified API URL from a relative path. */
export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const origin = backendOrigin();
  if (!path.startsWith('/')) {
    return `${origin}/${path}`;
  }
  return `${origin}${path}`;
}

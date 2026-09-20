export function createCsp({ env = {}, development = false } = {}) {
  const rawApi = String(env.VITE_API_URL || '').trim();
  if (!rawApi && !development) {
    throw new Error('Set VITE_API_URL for the production/preview CSP build');
  }
  const api = rawApi || 'http://localhost:3000/api';
  let apiSource = "'self'";
  if (!api.startsWith('/') || api.startsWith('//')) {
    const url = new URL(api);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      throw new Error('VITE_API_URL must be an HTTP(S) URL without credentials');
    }
    // Local production-build testing uses the existing HTTP backend. Remote
    // deployments must use HTTPS; do not allow arbitrary insecure API origins.
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (!development && url.protocol !== 'https:' && !loopback) {
      throw new Error('Use an HTTPS API, local loopback API, or same-origin /api');
    }
    apiSource = url.origin;
  }

  const domain = String(env.VITE_JITSI_DOMAIN || 'meet.jit.si').trim();
  if (!/^[a-z0-9.-]+(?::[0-9]+)?$/i.test(domain)) {
    throw new Error('VITE_JITSI_DOMAIN must be a hostname with optional port');
  }
  const jitsi = new URL(`https://${domain}`).origin;
  const unique = values => [...new Set(values)];
  const directives = {
    'default-src': ["'self'"],
    'base-uri': ["'none'"],
    'object-src': ["'none'"],
    'frame-ancestors': ["'self'"],
    'form-action': ["'self'"],
    'script-src': [
      "'self'",
      'https://maps.googleapis.com',
      'https://maps.gstatic.com',
      jitsi,
      ...(development ? ["'unsafe-inline'"] : []),
    ],
    'script-src-attr': ["'none'"],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
      'https://assets.calendly.com',
    ],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': unique([
      "'self'",
      'data:',
      'blob:',
      apiSource,
      'https://res.cloudinary.com',
      'https://maps.googleapis.com',
      'https://maps.gstatic.com',
    ]),
    'connect-src': unique([
      "'self'",
      apiSource,
      'https://translate.googleapis.com',
      'https://maps.googleapis.com',
      'https://maps.gstatic.com',
      ...(development ? ['ws://localhost:5173', 'ws://127.0.0.1:5173'] : []),
    ]),
    'frame-src': [jitsi, 'https://www.google.com', 'https://maps.google.com'],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    'media-src': ["'self'", 'blob:'],
  };
  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(' ')}`)
    .join('; ');
}

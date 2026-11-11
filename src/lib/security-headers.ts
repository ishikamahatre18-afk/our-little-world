// Browser-side protections, added to every page the server sends.
// Written for this app's exact needs: its own files, Supabase (login, data, photos, live chat) and Google Fonts.

function hostOf(raw: unknown): string {
  try {
    return typeof raw === 'string' && raw ? new URL(raw).host : '';
  } catch {
    return '';
  }
}

/** The backend addresses this app talks to, read when needed (not at start-up). Falls back to any Supabase project. */
function supabaseHosts(): string[] {
  const fromServer = hostOf(typeof process !== 'undefined' ? process.env?.['SUPABASE_URL'] : undefined);
  const fromBuild = hostOf((import.meta as { env?: Record<string, unknown> }).env?.['VITE_SUPABASE_URL']);
  const hosts = [...new Set([fromServer, fromBuild].filter(Boolean))];
  return hosts.length > 0 ? hosts : ['*.supabase.co'];
}

export function contentSecurityPolicy(): string {
  const hosts = supabaseHosts();
  const https = hosts.map(host => `https://${host}`).join(' ');
  const wss = hosts.map(host => `wss://${host}`).join(' ');
  return [
    "default-src 'self'",
    // The page's own start-up script is inline, so inline scripts must stay allowed. Nothing from other sites can run.
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' data: blob: ${https}`,
    `connect-src 'self' ${https} ${wss}`,
    "manifest-src 'self'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

export const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

/** Returns the same response with the protective headers added. Pages are never cached by shared caches. */
export function withSecurityHeaders(response: Response, request: Request): Response {
  // Redirects and websockets can have immutable headers; rebuild only when needed.
  let headers = response.headers;
  try {
    headers.set('X-Content-Type-Options', 'nosniff');
  } catch {
    headers = new Headers(response.headers);
  }
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  const type = headers.get('content-type') ?? '';
  if (type.includes('text/html')) {
    headers.set('Content-Security-Policy', contentSecurityPolicy());
    headers.set('Cache-Control', 'private, no-store');
  }
  headers.delete('X-Powered-By');
  headers.delete('Server');
  if (headers === response.headers) return response;
  void request;
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

/** Plain-http requests are sent to https (Cloudflare already does this; this is the belt to its braces). */
export function httpsRedirect(request: Request): Response | null {
  const url = new URL(request.url);
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol === 'http:' && !local) {
    url.protocol = 'https:';
    return Response.redirect(url.toString(), 308);
  }
  return null;
}

/** @type {import('next').NextConfig} */
function securityHeaders() {
  const connectSrc = ["'self'"];
  const api = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (api) {
    try {
      connectSrc.push(new URL(api).origin);
    } catch {
      /* ignore invalid URL */
    }
  }

  const mediaSrc = ["'self'", 'blob:', 'data:'];
  const r2Public = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim();
  if (r2Public) {
    try {
      mediaSrc.push(new URL(r2Public).origin);
    } catch {
      /* ignore */
    }
  }
  // Ficheiros de mídia no R2 (ou outro HTTPS) — sem isto o <audio> fica 0:00 / bloqueado pela CSP
  mediaSrc.push('https:');

  const isProd = process.env.NODE_ENV === 'production';
  const scriptSrc = isProd
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

  const csp = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `media-src ${mediaSrc.join(' ')}`,
    `connect-src ${connectSrc.join(' ')}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];
  if (isProd) {
    csp.push('upgrade-insecure-requests');
  }

  const headers = [
    { key: 'Content-Security-Policy', value: csp.join('; ') },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(self), geolocation=(), payment=()',
    },
  ];

  if (process.env.NODE_ENV === 'production') {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubDomains',
    });
  }

  return headers;
}

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: process.env.SKIP_LINT !== 'true',
  },
  typescript: {
    ignoreBuildErrors: process.env.SKIP_TYPECHECK === 'true',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders(),
      },
    ];
  },
  async rewrites() {
    const backend = (process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${backend}/:path*`,
      },
    ];
  },
};

export default nextConfig;
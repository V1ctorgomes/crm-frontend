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

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "media-src 'self' blob: data:",
    `connect-src ${connectSrc.join(' ')}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];
  if (process.env.NODE_ENV === 'production') {
    csp.push('upgrade-insecure-requests');
  }

  return [
    { key: 'Content-Security-Policy', value: csp.join('; ') },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(self), geolocation=(), payment=()',
    },
  ];
}

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
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
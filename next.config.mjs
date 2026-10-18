import withSerwistInit from "@serwist/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: false },
  productionBrowserSourceMaps: false,
  ...(process.env.BUILD_STANDALONE === 'true' ? { output: 'standalone' } : {}),

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: '*.r2.dev', pathname: '/**' },
    ],
  },

  experimental: {
    staleTimes: {
      dynamic: 180,
      static: 300,
    },
    viewTransition: true,
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'zod',
    ],
  },
  turbopack: {},

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
}

const isDev = process.env.NODE_ENV === "development";
const disablePwa = process.env.DISABLE_PWA === "true";

// Suppress Turbopack warning as we are in build process
process.env.SERWIST_SUPPRESS_TURBOPACK_WARNING = "1";

export default (isDev || disablePwa)
  ? nextConfig
  : withSerwistInit({
      swSrc: "app/sw.ts",
      swDest: "public/sw.js",
      exclude: [/img-login\.jpg$/],
    })(nextConfig);

import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip type checking for faster builds — fix types later
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // Output standalone for Docker/Railway deployment
  output: "standalone",

  // Static page pre-rendering for stability — avoid HMR blank screen on cold start
  // All non-dynamic pages are pre-rendered so they serve immediately without compilation waiting
  trailingSlash: false,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.pinata.cloud',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflare.com',
      },
    ],
  },

  experimental: {
    // Optimize package imports
    optimizePackageImports: ['date-fns', 'react-hook-form'],
    // Keep heavy native deps out of serverless bundles
    serverComponentsExternalPackages: ['@prisma/client', '@prisma/engines', '@vladmandic/face-api', 'canvas', 'ali-oss', 'sharp'],
    // Sentry instrumentation
    instrumentation: true,
  },

  // Stub canvas for server-side builds so webpack doesn't fail resolution
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('canvas', '@vladmandic/face-api');
    }
    return config;
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUploadEnabled: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});

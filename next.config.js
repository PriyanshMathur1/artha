/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ['yahoo-finance2'],
  // Don't fail Vercel builds on lint warnings — the codebase has pre-existing
  // ESLint config drift that's unrelated to runtime correctness. Run `npm run lint`
  // locally before merging if you care about lint hygiene.
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.yahoo.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Exclude yahoo-finance2 test/Deno files that reference missing modules
    config.resolve.alias = {
      ...config.resolve.alias,
      '@std/testing/mock': false,
      '@std/testing/bdd': false,
      '@gadicc/fetch-mock-cache/runtimes/deno.ts': false,
      '@gadicc/fetch-mock-cache/stores/fs.ts': false,
    };

    // Ignore the fetchCache test file entirely
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /yahoo-finance2.*fetchCache\.js$/,
      use: 'null-loader',
    });

    return config;
  },
};

module.exports = nextConfig;

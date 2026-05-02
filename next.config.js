/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next 15: promoted out of `experimental`, renamed from serverComponentsExternalPackages
  serverExternalPackages: ['yahoo-finance2'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.zerodha.com' },
      { protocol: 'https', hostname: '**.angelone.in' },
    ],
  },
};

module.exports = nextConfig;

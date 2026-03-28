/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Polyfill Node.js modules for browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
        process: require.resolve('process/browser'),
      };
      
      // Force browser build of Drift SDK
      config.resolve.alias = {
        ...config.resolve.alias,
        '@drift-labs/sdk': '@drift-labs/sdk/lib/browser',
      };
    }
    return config;
  },
  images: {
    domains: ['solswap.cloud', 'perps.solswap.cloud'],
    unoptimized: true,
  },
  output: 'standalone',
}
module.exports = nextConfig

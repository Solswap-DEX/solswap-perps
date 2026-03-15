/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // NO output: 'export' — this is a server-side app
  images: {
    domains: ['solswap.cloud', 'perps.solswap.cloud'],
    unoptimized: true,
  },
}
module.exports = nextConfig

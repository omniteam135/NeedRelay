/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config) => {
    // groq-sdk pulls in node-fetch which references an optional 'encoding' package;
    // leaflet's CJS build references Node built-ins that don't exist in the browser.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      encoding: false,
      path: false,
      util: false,
      fs: false,
      http: false,
      https: false,
      url: false,
      stream: false,
      zlib: false,
      tty: false,
      os: false,
      child_process: false,
      net: false,
      tls: false,
      crypto: false,
    };
    return config;
  },
};

module.exports = nextConfig;

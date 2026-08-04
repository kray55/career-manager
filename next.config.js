/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  images: { domains: ['localhost'] },
  webpack: (config, { isServer }) => {
    // next-auth's newer patch releases reference next/headers (an App
    // Router-only API) even in code paths a Pages Router app never
    // reaches at runtime. Webpack still tries to statically resolve it,
    // so stub it out — safe since this project has no app/ directory.
    config.resolve.fallback = { ...config.resolve.fallback, 'next/headers': false };
    config.optimization.minimize = false;
    config.optimization.concatenateModules = false;
    config.optimization.splitChunks = {
      chunks: 'async',
      minSize: 50000,
      maxSize: 200000,
      cacheGroups: {},
    };
    // Reduce memory usage
    config.performance = false;
    return config;
  },
  // Reduce parallel compilations
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};

module.exports = nextConfig;

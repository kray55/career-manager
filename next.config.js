/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  images: { domains: ['localhost'] },
  webpack: (config, { isServer }) => {
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

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // ignore 'fs' module for pdf parsing modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        "node:fs/promises": false,
        module: false,
        perf_hooks: false,
      };
    }
    return config;
  },
};

export default nextConfig;

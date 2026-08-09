import type { NextConfig } from 'next';
import webpack from 'webpack';

const nextConfig: NextConfig = {
  output: 'export',
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Comprehensive polyfills for browser/static environment
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        http2: false,
        http: false,
        https: false,
        stream: false,
        zlib: false,
        crypto: false,
        os: false,
        path: false,
        async_hooks: false,
        buffer: false,
        events: false,
        util: false,
        url: false,
        string_decoder: false,
        querystring: false,
        punycode: false,
        process: false,
        perf_hooks: false,
      };

      // Aggressively ignore Node.js specific modules and AI frameworks during client-side bundling
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, '');
        }),
        new webpack.IgnorePlugin({
          resourceRegExp: /^(async_hooks|perf_hooks|child_process|fs|net|tls|dns|http2|genkit|@genkit-ai\/.*|@opentelemetry\/.*)$/,
        })
      );
    }
    return config;
  },
};

export default nextConfig;

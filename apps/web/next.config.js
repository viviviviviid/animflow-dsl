const path = require("node:path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../.."),
    outputFileTracingIncludes: {
      "/api/publish": ["./packages/publish/dist/compile-worker.bundle.js"],
    },
  },
};

module.exports = nextConfig;

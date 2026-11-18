import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

const previewAddresses = Object.values(networkInterfaces()).flatMap((interfaces) =>
  (interfaces ?? []).filter(({ family, internal }) => family === "IPv4" && !internal).map(({ address }) => address),
);

const nextConfig: NextConfig = {
  // Let the dev client connect through Next's Network URL as well as localhost.
  allowedDevOrigins: ["127.0.0.1", ...previewAddresses],
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Rebuild styles on dev startup so an older bundle cannot outlive a restart.
    turbopackFileSystemCacheForDev: false,
  },
  turbopack: {
    // Pin the project root so the build ignores any lockfiles above this folder.
    root: import.meta.dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

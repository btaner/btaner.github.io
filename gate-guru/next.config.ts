import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components / Partial Prefetching are off: every page here is request-time
  // (search params, current time for open-now). See DECISIONS.md #2.
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

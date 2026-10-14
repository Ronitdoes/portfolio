import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        // Frame sequence scrubbed on scroll: immutable, cache at the edge for a year
        source: "/ezgif-47d5d9e8e7ec8ee7-jpg/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

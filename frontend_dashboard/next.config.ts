import type { NextConfig } from "next";

/**
 * Next.js configuration for the Insurance Fraud Detection Platform frontend.
 * Proxies API requests to the backend service running on port 3001.
 */
const nextConfig: NextConfig = {
  /* Proxy API calls to the FastAPI backend */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

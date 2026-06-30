import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /*
     * Required for local Laravel images in Next.js 16.
     * Use this only for local development.
     */
    dangerouslyAllowLocalIP: true,

    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/storage/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/storage/**",
      },
      {
        /*
         * Placeholder image fallback used when a product
         * has no uploaded image yet.
         */
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
};

export default nextConfig;
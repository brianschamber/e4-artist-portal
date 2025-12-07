import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // TEMP: allow production builds even if there are TypeScript errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

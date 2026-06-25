import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "https://preview-3411c4ce-e296-4226-bd1a-7ea20c6919cf.space-z.ai",
  ],
};

export default nextConfig;

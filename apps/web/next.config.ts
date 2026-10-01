import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained deploy artifact (.next/standalone) for VPS/Docker hosts.
  output: "standalone",
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs"],
  allowedDevOrigins: ["192.168.0.101", "localhost:3000"]
};

export default nextConfig;

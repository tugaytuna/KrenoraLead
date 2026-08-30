import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  transpilePackages: ["@krenora/database", "@krenora/shared", "@krenora/scoring"],
};

export default nextConfig;

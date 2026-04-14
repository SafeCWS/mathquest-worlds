import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.GITHUB_PAGES ? "export" : "standalone",
  basePath: process.env.GITHUB_PAGES ? "/mathquest-worlds" : "",
  trailingSlash: process.env.GITHUB_PAGES ? true : false,
  images: process.env.GITHUB_PAGES ? { unoptimized: true } : {},
};

export default nextConfig;

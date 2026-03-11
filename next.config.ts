/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS || false;
const repo = "velox-api";

const nextConfig = {
  output: "export",
  images: { unoptimized: true },

  // This tells Next.js: "Everything starts with /velox-api"
  basePath: isGithubActions ? `/${repo}` : "",

  // This tells Next.js: "Find JS/CSS files at /velox-api/"
  assetPrefix: isGithubActions ? `/${repo}/` : "",

  trailingSlash: true,
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const env = process.env.NODE_ENV;
const ghp = process.env.NEXT_PUBLIC_GITHUB_PAGES;
const nextConfig = {
  distDir: "out",
  output: env === "production" ? "export" : "standalone",
  reactStrictMode: true,
  basePath:
    env !== "production" ? "" : ghp !== "false" ? "/ipns-eth-client" : "",
  assetPrefix:
    env !== "production" ? "" : ghp !== "false" ? "/ipns-eth-client/" : "",
  ...(env === "production" && {
    images: {
      loader: "akamai",
      path: "",
    },
  }),
  exportPathMap: async function (defaultPathMap) {
    return {
      "/": { page: "/" },
    };
  },
};

module.exports = nextConfig;

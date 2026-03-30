const nextConfig = {
  reactStrictMode: true,
  env: {
    RIOT_API_KEY: process.env.RIOT_API_KEY,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
      },
      {
        protocol: "https",
        hostname: "raw.communitydragon.org",
      },
    ],
  },
};
module.exports = nextConfig;

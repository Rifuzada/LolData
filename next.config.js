/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    env: {
        RIOT_API_KEY: process.env.RIOT_API_KEY,
    },
    images: {
        domains: [
            'ddragon.leagueoflegends.com',
            'raw.communitydragon.org'
        ],
    },
};

module.exports = nextConfig;
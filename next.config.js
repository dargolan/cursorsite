/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'dargo-strapi-media.s3.eu-north-1.amazonaws.com',
        pathname: '**',
      },
    ],
  },
};

module.exports = nextConfig; 
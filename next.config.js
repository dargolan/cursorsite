/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '**'
      },
      {
        protocol: 'https',
        hostname: 'dargo-strapi-media.s3.eu-north-1.amazonaws.com',
        pathname: '**'
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
        pathname: '**'
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '**'
      },
      {
        protocol: 'https',
        hostname: 'd1r94114aksajj.cloudfront.net',
        pathname: '**'
      }
    ]
  },
  async headers() {
    return [
      {
        // For all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, HEAD, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: '*'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;

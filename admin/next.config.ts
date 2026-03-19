import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 允许从 api 服务器加载图片
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/images/**',
      },
    ],
  },
}

export default nextConfig

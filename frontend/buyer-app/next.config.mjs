/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bật React Strict Mode để phát hiện lỗi sớm hơn
  reactStrictMode: true,
  transpilePackages: ["@phosphor-icons/react"],

  // Cho phép Next.js kết nối tới backend API server (chạy ở port 3000)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  },
};

export default nextConfig;

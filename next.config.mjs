/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // テンプレート .xlsx を API ルートの Vercel バンドルに必ず含める
    outputFileTracingIncludes: {
      '/api/export': ['./templates/**'],
    },
  },
};

export default nextConfig;

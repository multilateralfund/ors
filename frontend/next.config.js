/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: `/${process.env.NEXT_PUBLIC_API_PATH_TRAVERSAL}/:path*`,
        destination: `${process.env.NEXT_PUBLIC_API_PATH}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig

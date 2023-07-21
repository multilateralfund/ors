/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mui/system', '@mui/material'],
}

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
})

module.exports = withBundleAnalyzer(nextConfig)

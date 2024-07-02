import createBundleAnalyzer from '@next/bundle-analyzer'
import createMDX from '@next/mdx'
import { withSentryConfig } from '@sentry/nextjs'

// import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeSlug from 'rehype-slug'
import rehypeToc from 'rehype-toc'
// import remarkToc from 'remark-toc'

import transformModulesMapper from './transform.modules.json' with { type: 'json' }

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  experimental: {
    instrumentationHook: true,
  },
  reactStrictMode: true,
  webpack: (config, { dev, isServer, webpack }) => {
    const globals = {
      __CLIENT__: !isServer,
      __DEVELOPMENT__: !!dev,
      __SERVER__: isServer,
    }

    config.plugins.unshift(new webpack.DefinePlugin(globals))

    if (!dev) {
      config.module.rules.unshift({
        exclude: /node_modules/,
        test: /\.(?:js|jsx|ts|tsx)$/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
              [
                'transform-imports',
                {
                  '@mui/material': {
                    transform: (importName) => {
                      const muiTransforms =
                        transformModulesMapper['@mui/material']
                      if (muiTransforms[importName]) {
                        return muiTransforms[importName]
                      }
                      return '@mui/material'
                    },
                  },
                  // '@ors/components': {
                  //   transform: (importName) => {
                  //     const componentsTranstormer =
                  //       transformModulesMapper['@ors/components']
                  //     if (componentsTranstormer[importName]) {
                  //       return componentsTranstormer[importName]
                  //     }
                  //     return '@ors/components'
                  //   },
                  // },
                },
              ],
            ],
            presets: ['next/babel'],
          },
        },
      })
    }

    config.module.rules.push({
      test: /\.svg$/i,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            svgoConfig: {
              plugins: [
                {
                  name: 'preset-default',
                  params: {
                    overrides: {
                      removeViewBox: false,
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    })

    return config
  },
}

const withMDX = createMDX({
  options: {
    rehypePlugins: [
      rehypeSlug,
      // [
      //   rehypeAutolinkHeadings,
      //   {
      //     behaviour: 'append',
      //     properties: {
      //       ariaHidden: true,
      //       className: 'hash-link',
      //       tabIndex: -1,
      //     },
      //   },
      // ],
      [rehypeToc, { position: 'beforebegin' }],
    ],
    // remarkPlugins: [remarkToc],
  },
})

const mdxNextConfig = withMDX(nextConfig)

const sentryNextConfig = withSentryConfig(mdxNextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: 'eaudeweb',
  project: 'mlfs-nextjs',
  url: 'https://sentry.edw.ro/',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: false,
})

export default withBundleAnalyzer(sentryNextConfig)

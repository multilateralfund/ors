import createBundleAnalyzer from '@next/bundle-analyzer'
import createMDX from '@next/mdx'
// import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeSlug from 'rehype-slug'
import rehypeToc from 'rehype-toc'
// import remarkToc from 'remark-toc'

import transformModulesMapper from './transform.modules.json' assert { type: 'json' }

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
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

export default withBundleAnalyzer(withMDX(nextConfig))

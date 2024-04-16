const transformModulesMapper = require('./transform.modules.json')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
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

module.exports = withBundleAnalyzer(nextConfig)

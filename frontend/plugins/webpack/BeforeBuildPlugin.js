const { exec } = require('child_process')
const webpack = require('webpack')
const path = require('path')
const fs = require('fs')

const root = process.cwd()

class BeforeBuildPlugin {
  constructor(options) {
    this.options = options
  }

  apply(compiler) {
    compiler.hooks.beforeRun.tapAsync(
      'BeforeBuildPlugin',
      (compilation, callback) => {
        const script = path.resolve(__dirname, this.options.entry)
        const webpackConfig = {
          entry: [script, ...(this.options.entries || [])],
          mode: 'development',
          module: {
            rules: [
              {
                exclude: /node_modules/,
                test: /\.(m?js|jsx|ts|tsx)$/,
                use: {
                  loader: 'babel-loader',
                  options: {
                    presets: ['next/babel'],
                  },
                },
              },
            ],
          },
          output: {
            filename: 'bundle.js',
            path: path.resolve(__dirname, '.before-build'),
          },
          resolve: {
            alias: {
              '@ors': path.resolve(root, 'src'),
            },
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
          },
          target: 'node',
        }

        webpack(webpackConfig, (err) => {
          if (err) {
            console.error('Error occurred while running the script:', err)
            return
          }

          const bundleDir = path.resolve(__dirname, '.before-build')
          const bundlePath = path.resolve(
            __dirname,
            '.before-build',
            'bundle.js',
          )

          // Run the transpiled script
          exec(`node ${bundlePath}`, (error, stdout) => {
            if (error) {
              console.error(error)
            } else {
              console.log(stdout)
            }
            // Remove the .before-build
            fs.rm(bundleDir, { recursive: true }, (err) => {
              if (err) {
                console.error('Error occurred while removing the bundle:', err)
              }
              callback()
            })
          })
        })
      },
    )
  }
}

module.exports = BeforeBuildPlugin

import grey from '@mui/material/colors/grey'

const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/themes/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  corePlugins: {
    preflight: false,
  },
  darkMode: ['class', '[data-mode="dark"]'],
  important: '#next-app',
  plugins: [],
  theme: {
    extend: {
      colors: {
        error: {
          DEFAULT: colors.red[500],
        },
        grey: {
          ...colors.gray,
          A100: grey.A100,
          A200: grey.A200,
          A400: grey.A400,
          A700: grey.A700,
        },
        info: {
          DEFAULT: colors.blue[500],
        },
        primary: {
          DEFAULT: '#0f82cc',
          contrastText: '#ffffff',
        },
        secondary: {
          DEFAULT: '#333333',
          contrastText: '#ffffff',
        },
        success: {
          DEFAULT: colors.green[500],
        },
        warning: {
          DEFAULT: colors.orange[500],
        },
      },
      zIndex: {
        'absolute': '9999',
      }
    },
  },
}

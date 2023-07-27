import grey from '@mui/material/colors/grey'
import { createThemes } from 'tw-colors'

const colors = require('tailwindcss/colors')

const gray = {
  ...colors.gray,
  A100: grey.A100,
  A200: grey.A200,
  A400: grey.A400,
  A700: grey.A700,
}

const originalColors = {
  dark: {
    action: {
      active: '#fff',
      disabled: 'rgba(255, 255, 255, 0.3)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
      highlight: 'rgba(255, 255, 255, 0.08)',
      hover: 'rgba(255, 255, 255, 0.08)',
      selected: 'rgba(255, 255, 255, 0.16)',
    },
    background: {
      DEFAULT: colors.gray[900],
      paper: colors.gray[900],
    },
    divider: {
      DEFAULT: 'rgba(255, 255, 255, 0.12)',
    },
    error: {
      DEFAULT: colors.red[500],
    },
    gray,
    info: {
      DEFAULT: colors.blue[500],
    },
    mui: {
      box: {
        background: colors.gray[800],
        border: colors.gray[700],
      },
      paper: {
        border: colors.gray[700],
      },
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
    typography: {
      DEFAULT: 'rgba(0, 0, 0, 0.87)',
      disabled: 'rgba(255, 255, 255, 0.5)',
      primary: colors.white,
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
    warning: {
      DEFAULT: colors.orange[500],
    },
  },
  light: {
    action: {
      active: 'rgba(0, 0, 0, 0.54)',
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
      highlight: 'rgba(0, 0, 0, 0.04)',
      hover: 'rgba(0, 0, 0, 0.04)',
      selected: 'rgba(0, 0, 0, 0.08)',
    },
    background: {
      DEFAULT: colors.gray[50],
      paper: colors.white,
    },
    divider: {
      DEFAULT: 'rgba(0, 0, 0, 0.12)',
    },
    error: {
      DEFAULT: colors.red[500],
    },
    gray,
    info: {
      DEFAULT: colors.blue[500],
    },
    mui: {
      box: {
        background: colors.white,
        border: colors.gray[200],
      },
      paper: {
        border: colors.gray[200],
      },
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
    typography: {
      DEFAULT: 'rgba(0, 0, 0, 0.87)',
      disabled: 'rgba(0, 0, 0, 0.38)',
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
    warning: {
      DEFAULT: colors.orange[500],
    },
  },
}

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
  important: '#next-app',
  originalColors,
  plugins: [
    createThemes(({ dark, light }) => ({
      dark: dark(originalColors.dark),
      light: light(originalColors.light),
    })),
  ],
  theme: {
    extend: {
      colors: {
        gray,
      },
      zIndex: {
        absolute: '9999',
      },
    },
  },
}

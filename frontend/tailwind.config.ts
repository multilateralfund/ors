import grey from '@mui/material/colors/grey'
import { Config } from 'tailwindcss'
import { createThemes } from 'tw-colors'

const colors = require('tailwindcss/colors')

const gray = {
  ...colors.gray,
  50: '#F9FAFB',
  100: '#F2F4F7',
  200: '#EAECF0',
  400: '#98A2B3',
  500: '#667085',
  700: '#344054',
  900: '#101828',
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
      DEFAULT: gray[900],
      paper: gray[900],
    },
    divider: {
      DEFAULT: 'rgba(255, 255, 255, 0.12)',
    },
    error: {
      DEFAULT: colors.red[500],
      contrastText: '#ffffff',
    },
    gray,
    info: {
      DEFAULT: colors.blue[500],
    },
    mui: {
      box: {
        background: gray[800],
        border: gray[700],
      },
      paper: {
        border: gray[700],
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
      DEFAULT: 'rgba(255, 255, 255, 1)',
      disabled: 'rgba(255, 255, 255, 0.5)',
      primary: 'rgba(255, 255, 255, 1)',
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
      DEFAULT: gray[50],
      paper: colors.white,
    },
    divider: {
      DEFAULT: gray[100],
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
        border: gray[200],
      },
      paper: {
        border: gray[200],
      },
    },
    primary: {
      DEFAULT: '#0f82cc',
      contrastText: '#ffffff',
    },
    secondary: {
      DEFAULT: gray[700],
      contrastText: '#ffffff',
    },
    success: {
      DEFAULT: colors.green[500],
      contrastText: '#000000',
    },
    typography: {
      DEFAULT: gray[900],
      disabled: gray[400],
      primary: gray[900],
      secondary: gray[500],
    },
    warning: {
      DEFAULT: colors.orange[500],
    },
  },
}

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
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        gray,
      },
      zIndex: {
        absolute: '9999',
      },
    },
  },
} as Config

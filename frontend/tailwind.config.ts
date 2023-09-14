import grey from '@mui/material/colors/grey'
import { Config } from 'tailwindcss'
import { createThemes } from 'tw-colors'

const colors = require('tailwindcss/colors')

const gray = {
  ...colors.gray,
  A100: grey.A100,
  A200: grey.A200,
  A400: grey.A400,
  A700: grey.A700,
  B50: '#F9FAFB',
  B100: '#F2F4F7',
  B200: '#EAECF0',
  B400: '#98A2B3',
  B500: '#667085',
  B700: '#344054',
  B900: '#101828',
  MUI50: grey[50],
  MUI200: grey[200],
  MUI300: grey[300],
  MUI400: grey[400],
  MUI500: grey[500],
  MUI600: grey[600],
  MUI700: grey[700],
  MUI800: grey[800],
  MUI900: grey[900],
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
    divider: {
      DEFAULT: gray[700],
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
      default: {
        background: gray[900],
        border: 'rgba(255, 255, 255, 0.23)',
      },
      paper: {
        background: gray[800],
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
      disabled: 'rgba(255, 255, 255, 0.4)',
      faded: 'rgba(255, 255, 255, 0.5)',
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
    divider: {
      DEFAULT: gray[200],
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
      default: {
        background: gray[50],
        border: 'rgba(0, 0, 0, 0.23)',
      },
      paper: {
        background: colors.white,
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
      faded: gray[500],
      primary: gray[900],
      secondary: gray[700],
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
    createThemes(
      ({ dark, light }) => ({
        dark: dark(originalColors.dark),
        light: light(originalColors.light),
      }),
      {
        produceThemeClass: (themeName) => `theme-${themeName}`,
        produceThemeVariant: (themeName) => `theme-${themeName}`,
      },
    ),
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

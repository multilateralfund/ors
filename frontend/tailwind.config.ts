/* eslint-disable perfectionist/sort-objects */
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
      DEFAULT: '#EE3939',
    },
    gray,
    info: {
      DEFAULT: '#006C9A',
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
      DEFAULT: '#0095D5',
      contrastText: '#ffffff',
    },
    secondary: {
      DEFAULT: '#333333',
      contrastText: '#ffffff',
    },
    success: {
      DEFAULT: '#36A41D',
    },
    typography: {
      DEFAULT: 'rgba(255, 255, 255, 1)',
      disabled: 'rgba(255, 255, 255, 0.4)',
      faded: 'rgba(255, 255, 255, 0.5)',
      primary: 'rgba(255, 255, 255, 1)',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
    warning: {
      DEFAULT: '#FF8A00',
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
      DEFAULT: '#EE3939',
    },
    gray,
    info: {
      DEFAULT: '#006C9A',
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
      DEFAULT: '#0095D5',
      contrastText: '#ffffff',
    },
    secondary: {
      DEFAULT: gray[700],
      contrastText: '#ffffff',
    },
    success: {
      DEFAULT: '#36A41D',
    },
    typography: {
      DEFAULT: gray[900],
      disabled: gray[400],
      faded: gray[500],
      primary: gray[900],
      secondary: gray[700],
    },
    warning: {
      DEFAULT: '#FF8A00',
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
    container: false,
    preflight: false,
    transitionProperty: false,
  },
  safelist: ['text-red-500'],
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
    function ({ addComponents, addUtilities }: any) {
      addComponents({
        '.container': {
          margin: '0 auto',
          maxWidth: '100%',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          '@screen sm': {
            maxWidth: '100%',
          },
          '@screen md': {
            maxWidth: '100%',
          },
          '@screen lg': {
            maxWidth: '100%',
          },
          '@screen xl': {
            maxWidth: '100%',
          },
          '@screen 2xl': {
            maxWidth: '1920px',
          },
        },
      })
      addUtilities({
        '.transition': {
          'transition-property':
            'background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, filter, backdrop-filter',
          'transition-timing-function': 'cubic-bezier(0.4, 0, 0.2, 1)',
          'transition-duration': '300ms',
        },
        '.transition-all': {
          'transition-property': 'all',
          'transition-timing-function': 'cubic-bezier(0.4, 0, 0.2, 1)',
          'transition-duration': '300ms',
        },
        '.absolute-center': {
          '--tw-translate-x': '-50%',
          '--tw-translate-y': '-50%',
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform:
            'translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))',
        },
      })
    },
    require('tailwindcss-bg-patterns'),
  ],
  theme: {
    fontSize: {
      xs: [
        '0.625rem',
        {
          lineHeight: '1rem',
        },
      ],
      sm: [
        '0.75rem',
        {
          lineHeight: '1.25rem',
        },
      ],
      base: [
        '0.875rem',
        {
          lineHeight: '1.25rem',
        },
      ],
      lg: [
        '1rem',
        {
          lineHeight: '1.5rem',
        },
      ],
      xl: [
        '1.125rem',
        {
          lineHeight: '1.75rem',
        },
      ],
      '2xl': [
        '1.25rem',
        {
          lineHeight: '1.75rem',
        },
      ],
      '3xl': [
        '1.5rem',
        {
          lineHeight: '2rem',
        },
      ],
      '4xl': [
        '1.875rem',
        {
          lineHeight: '2.25rem',
        },
      ],
      '5xl': [
        '2.25rem',
        {
          lineHeight: '2.5',
        },
      ],
      '6xl': [
        '3rem',
        {
          lineHeight: '1',
        },
      ],
    },
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
    screens: {
      '2xl': '1920px',
      lg: '1024px',
      md: '768px',
      sm: '640px',
      xl: '1280px',
    },
  },
} as Config

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  corePlugins: {
    preflight: false,
  },
  important: '#__next',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0f82cc',
          contrast: '#ffffff',
        },
        secondary: {
          DEFAULT: '#333333',
          contrast: '#ffffff',
        },
        base: {
          DEFAULT: '#333333',
          light: '#333333',
          dark: '#ffffff',
          contrast: '#ffffff',
          'dark-contrast': '#333333',
        },
      },
    },
  },
  darkMode: ['class', '[data-mode="dark"]'],
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
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
        base: {
          DEFAULT: '#333333',
          contrast: '#ffffff',
          dark: '#ffffff',
          'dark-contrast': '#333333',
          light: '#333333',
        },
        primary: {
          DEFAULT: '#0f82cc',
          contrast: '#ffffff',
        },
        secondary: {
          DEFAULT: '#333333',
          contrast: '#ffffff',
        },
      },
    },
  },
}

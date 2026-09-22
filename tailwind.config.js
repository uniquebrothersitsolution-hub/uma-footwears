/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cms: {
          bg: '#F7F8FC',
          card: '#FFFFFF',
          sidebar: '#FFFFFF',
          primary: '#6D5DFB',
          hover: '#5B4AE8',
          soft: '#EEEBFF',
          text: '#1E1B4B',
          subtext: '#64748B',
          border: '#E7E5EF',
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'cms': '12px',
        'cms-lg': '14px',
      },
      boxShadow: {
        'cms-sm': '0 1px 3px 0 rgba(30, 27, 75, 0.04), 0 1px 2px -1px rgba(30, 27, 75, 0.02)',
        'cms': '0 4px 12px 0 rgba(30, 27, 75, 0.05)',
        'cms-md': '0 8px 20px -4px rgba(109, 93, 251, 0.12)',
      }
    },
  },
  plugins: [],
}

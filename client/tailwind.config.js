/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Duygu renkleri
        emotion: {
          mutlu: { light: '#FFFDE7', DEFAULT: '#FFC107', dark: '#FF8F00' },
          uzgun: { light: '#E3F2FD', DEFAULT: '#42A5F5', dark: '#1565C0' },
          kizgin: { light: '#FFEBEE', DEFAULT: '#EF5350', dark: '#C62828' },
          korku: { light: '#F3E5F5', DEFAULT: '#AB47BC', dark: '#6A1B9A' },
          saskin: { light: '#E8F5E9', DEFAULT: '#66BB6A', dark: '#2E7D32' },
          igrenme: { light: '#FBE9E7', DEFAULT: '#FF7043', dark: '#D84315' },
          notr: { light: '#F5F5F5', DEFAULT: '#9E9E9E', dark: '#616161' },
        },
        // Ana tema renkleri
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

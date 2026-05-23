/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FFB6C1',
          light: '#FFD1DC',
          dark: '#FF8DA1',
        },
        secondary: {
          DEFAULT: '#FFF8E7',
          light: '#FFFDF5',
          dark: '#F5E6D3',
        },
        accent: {
          DEFAULT: '#FF8DA1',
          light: '#FFB6C1',
          dark: '#E67388',
        },
        light: {
          bg: '#F8F9FA',
          card: '#FFFFFF',
          border: '#E5E7EB',
          text: '#1F2937',
          muted: '#6B7280',
        },
        danger: {
          DEFAULT: '#FF4777',
          light: '#FF6B8A',
          dark: '#CC2952',
        },
        warning: {
          DEFAULT: '#FFD480',
          light: '#FFE8B5',
          dark: '#CC9D3F',
        },
        success: {
          DEFAULT: '#7BC4A8',
          light: '#A3D9C4',
          dark: '#5AAD8F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#F0F4FF',
          secondary: '#FFFFFF',
          dark: '#080D1A',
          'dark-card': '#111827',
        },
        emergency: {
          red: '#EF4444',
          'red-glow': 'rgba(239,68,68,0.15)',
          amber: '#F59E0B',
          'amber-glow': 'rgba(245,158,11,0.12)',
          green: '#10B981',
          'green-glow': 'rgba(16,185,129,0.12)',
          blue: '#3B82F6',
        },
        chart: {
          one: '#6366F1',
          two: '#10B981',
          three: '#F59E0B',
          four: '#EF4444',
          five: '#8B5CF6',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'count-up': 'countUp 0.8s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        countUp: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

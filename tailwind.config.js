/** @type {import('tailwindcss').Config} */
// v2 theme: light, clarity-first. The working screens are read from across a
// reception desk, so contrast and type size matter more than decoration.
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Page + surfaces. `canvas` and `surface` are the names the Flutter app
        // uses for the same values (lib/core/theme/tokens.dart); `page` and
        // `card` are kept because the dashboard is written in terms of them.
        page: '#F7F0E6',
        canvas: '#F7F0E6',
        card: '#FFFFFF',
        surface: '#FFFFFF',
        surfaceAlt: '#EFE5D8',
        line: '#E5D9C9',

        // The brand is the app's coral, not the old navy. `ink` is the darker
        // pair for anything with a white label on it: white on DEFAULT is
        // 3.4:1 and fails at normal text size.
        brand: { DEFAULT: '#F4551E', ink: '#C2410C', tint: '#FFEDE4', soft: '#FF7A55' },
        navy: '#252A5B',

        // Semantic colours — one meaning each, used consistently.
        // Reserved for emergencies and critical urgency. Never for delete
        // buttons or decoration — if red is everywhere it signals nothing.
        critical: { DEFAULT: '#D62828', tint: '#FDECEC', pressed: '#A81E1E' },
        decision: { DEFAULT: '#E08A1E', tint: '#FDF3E2' },
        ready: { DEFAULT: '#0FA37A', tint: '#E6F7EF' },
        info: { DEFAULT: '#2563EB', tint: '#EFF6FF' },

        // Neutral text ramp
        ink: {
          DEFAULT: '#1C1917',
          soft: '#57534E',
          muted: '#78716C',
          faint: '#A8A29E',
        },

        // Kept so the moved-over Analytics charts still render.
        emergency: {
          red: '#DC2626',
          amber: '#D97706',
          green: '#059669',
          blue: '#2563EB',
        },
        chart: {
          one: '#2563EB',
          two: '#059669',
          three: '#D97706',
          four: '#DC2626',
          five: '#7C3AED',
        },
      },
      fontSize: {
        eta: ['28px', { lineHeight: '1.1', fontWeight: '700' }],
        'card-title': ['17px', { lineHeight: '1.3', fontWeight: '600' }],
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(16,24,40,0.06)',
        'card-hover': '0 4px 12px rgba(16,24,40,0.10)',
        bar: '0 -1px 3px rgba(16,24,40,0.06)',
      },
      animation: {
        'slide-down': 'slideDown 0.28s ease-out',
        'fade-in': 'fadeIn 0.25s ease-out',
        'pulse-thrice': 'pulseSoft 1s ease-in-out 3',
      },
      keyframes: {
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
      },
    },
  },
  plugins: [],
};

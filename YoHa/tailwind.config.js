/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx}', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-jakarta)', 'var(--font-inter)', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      boxShadow: {
        glow: '0 10px 40px -10px rgba(249,115,22,.45)',
        'glow-lg': '0 20px 60px -10px rgba(249,115,22,.55)',
        'glow-pink': '0 20px 60px -10px rgba(236,72,153,.45)',
        'glow-violet': '0 20px 60px -10px rgba(139,92,246,.45)',
        soft: '0 8px 30px rgba(15,23,42,.08)',
        card: '0 4px 20px -2px rgba(15,23,42,.08)',
        cardhover: '0 24px 50px -12px rgba(15,23,42,.18)',
      },
      spacing: {
        'safe-nav': 'calc(4rem + env(safe-area-inset-bottom, 0px))',
      },
      animation: {
        'gradient-x': 'gradient-x 12s ease infinite',
        'gradient-fast': 'gradient-x 4s ease infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-med': 'float 6s ease-in-out infinite',
        'float-fast': 'float 4s ease-in-out infinite',
        blob: 'blob 22s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
        'spin-3d': 'spin-3d 40s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(.4,0,.6,1) infinite',
        'fade-up': 'fade-up .6s cubic-bezier(.16,1,.3,1) both',
        'fade-in': 'fade-in .5s ease-out both',
        'scale-in': 'scale-in .5s cubic-bezier(.16,1,.3,1) both',
        'slide-up': 'slide-up .5s cubic-bezier(.16,1,.3,1) both',
        'bounce-soft': 'bounce-soft .6s cubic-bezier(.16,1,.3,1) both',
        shimmer: 'shimmer 1.6s linear infinite',
        pop: 'pop .4s cubic-bezier(.16,1,.3,1) both',
        wiggle: 'wiggle .6s ease-in-out',
        'check-in': 'check-in .6s cubic-bezier(.16,1,.3,1) both',
        'loading-bar': 'loading-bar 1.6s cubic-bezier(.4,0,.2,1) forwards',
        'logo-build': 'logo-build .9s cubic-bezier(.16,1,.3,1) both',
        'bike-go': 'bike-go 4s ease-in-out infinite',
        'char-up': 'char-up .9s cubic-bezier(.16,1,.3,1) both',
        'reveal-y': 'reveal-y 1s cubic-bezier(.16,1,.3,1) both',
        orbit: 'orbit 20s linear infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%': { transform: 'translateY(-22px) translateX(8px)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0px,0px) scale(1)' },
          '33%': { transform: 'translate(36px,-58px) scale(1.12)' },
          '66%': { transform: 'translate(-24px,24px) scale(.92)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'bounce-soft': {
          '0%': { transform: 'scale(.6)', opacity: '0' },
          '60%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        pop: {
          '0%': { transform: 'scale(.8)', opacity: '0' },
          '50%': { transform: 'scale(1.06)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '20%': { transform: 'rotate(-10deg)' },
          '40%': { transform: 'rotate(10deg)' },
          '60%': { transform: 'rotate(-6deg)' },
          '80%': { transform: 'rotate(4deg)' },
        },
        'check-in': {
          '0%': { strokeDashoffset: '50' },
          '100%': { strokeDashoffset: '0' },
        },
        'loading-bar': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        'logo-build': {
          '0%': { opacity: '0', transform: 'scale(.4) rotate(-180deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        'bike-go': {
          '0%': { offsetDistance: '0%' },
          '100%': { offsetDistance: '100%' },
        },
        'char-up': {
          '0%': { opacity: '0', transform: 'translateY(80%) rotate(8deg)' },
          '100%': { opacity: '1', transform: 'translateY(0) rotate(0deg)' },
        },
        'reveal-y': {
          '0%': { clipPath: 'inset(100% 0 0 0)' },
          '100%': { clipPath: 'inset(0 0 0 0)' },
        },
        'spin-3d': {
          from: { transform: 'rotateY(0deg)' },
          to: { transform: 'rotateY(360deg)' },
        },
        orbit: {
          from: { transform: 'rotate(0deg) translateX(140px) rotate(0deg)' },
          to: { transform: 'rotate(360deg) translateX(140px) rotate(-360deg)' },
        },
      },
    },
  },
  plugins: [],
};

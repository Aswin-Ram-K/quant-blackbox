/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(215 25% 27%)',
        input: 'hsl(215 25% 27%)',
        ring: 'hsl(215 20% 65%)',
        background: {
          DEFAULT: 'hsl(224 20% 4%)',
          secondary: 'hsl(224 15% 6%)',
        },
        foreground: 'hsl(210 20% 92%)',
        card: {
          DEFAULT: 'hsl(224 15% 8%)',
          foreground: 'hsl(210 20% 92%)',
          border: 'hsl(215 20% 18%)',
        },
        primary: {
          DEFAULT: 'hsl(210 40% 45%)',
          foreground: 'hsl(224 20% 92%)',
          light: 'hsl(210 40% 55%)',
        },
        secondary: {
          DEFAULT: 'hsl(215 15% 12%)',
          foreground: 'hsl(210 20% 92%)',
        },
        muted: {
          DEFAULT: 'hsl(215 20% 22%)',
          foreground: 'hsl(215 20% 60%)',
        },
        accent: {
          DEFAULT: 'hsl(210 40% 45%)',
          foreground: 'hsl(224 20% 92%)',
        },
        destructive: {
          DEFAULT: 'hsl(0 62.8% 50.6%)',
          foreground: 'hsl(210 40% 92%)',
        },
        success: {
          DEFAULT: 'hsl(142 70% 45%)',
          foreground: 'hsl(224 20% 92%)',
        },
        warning: {
          DEFAULT: 'hsl(38 92% 55%)',
          foreground: 'hsl(224 20% 92%)',
        },
        chat: {
          sender: 'hsl(210 40% 35%)',
          receiver: 'hsl(215 20% 18%)',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'system-ui', 'ui-sans-serif', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(48,133,214,0.3)' },
          '50%': { boxShadow: '0 0 15px rgba(48,133,214,0.5)' },
        },
        'typing': {
          '0%, 60%, 100%': { opacity: '0.3' },
          '30%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'typing': 'typing 1.5s infinite',
      },
      maxWidth: {
        'chat': '400px',
      },
      screens: {
        'sm': '375px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      },
    },
  },
  plugins: [],
}

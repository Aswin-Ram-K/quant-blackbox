/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(215 25% 27%)',
        input: 'hsl(215 25% 27%)',
        ring: 'hsl(215 20% 65%)',
        background: 'hsl(224 20% 5%)',
        foreground: 'hsl(210 20% 90%)',
        card: {
          DEFAULT: 'hsl(224 15% 8%)',
          foreground: 'hsl(210 20% 90%)',
        },
        primary: {
          DEFAULT: 'hsl(210 40% 40%)',
          foreground: 'hsl(224 20% 90%)',
        },
        secondary: {
          DEFAULT: 'hsl(215 15% 15%)',
          foreground: 'hsl(210 20% 90%)',
        },
        muted: {
          DEFAULT: 'hsl(215 20% 20%)',
          foreground: 'hsl(215 20% 65%)',
        },
        accent: {
          DEFAULT: 'hsl(210 40% 40%)',
          foreground: 'hsl(224 20% 90%)',
        },
        destructive: {
          DEFAULT: 'hsl(0 62.8% 50.6%)',
          foreground: 'hsl(210 40% 90%)',
        },
        success: {
          DEFAULT: 'hsl(142 70% 45%)',
          foreground: 'hsl(224 20% 90%)',
        },
        warning: {
          DEFAULT: 'hsl(38 92% 55%)',
          foreground: 'hsl(224 20% 90%)',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'system-ui', 'ui-sans-serif', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(48,133,214,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(48,133,214,0.6)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

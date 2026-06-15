/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(215 25% 18%)',
        background: {
          DEFAULT: 'hsl(224 20% 4%)',
          card: 'hsl(224 18% 7%)',
          input: 'hsl(215 25% 12%)',
        },
        foreground: {
          DEFAULT: 'hsl(210 20% 92%)',
          muted: 'hsl(215 20% 55%)',
          accent: 'hsl(210 40% 70%)',
        },
        primary: {
          DEFAULT: 'hsl(210 45% 42%)',
          foreground: 'hsl(224 20% 95%)',
        },
        secondary: {
          DEFAULT: 'hsl(215 12% 15%)',
          foreground: 'hsl(210 20% 85%)',
        },
        muted: {
          DEFAULT: 'hsl(215 20% 15%)',
          foreground: 'hsl(215 20% 55%)',
        },
        accent: {
          DEFAULT: 'hsl(210 45% 42%)',
          foreground: 'hsl(224 20% 95%)',
        },
        destructive: {
          DEFAULT: 'hsl(0 65% 50%)',
          foreground: 'hsl(210 40% 90%)',
        },
        success: {
          DEFAULT: 'hsl(142 60% 45%)',
          foreground: 'hsl(224 20% 95%)',
        },
        warning: {
          DEFAULT: 'hsl(38 92% 55%)',
          foreground: 'hsl(224 20% 95%)',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'system-ui', 'ui-sans-serif', 'sans-serif'],
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
}

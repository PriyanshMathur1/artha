import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Artha brand palette — deep indigo (wisdom) + saffron accent (India) + jade (growth)
        bg: {
          DEFAULT: '#0a0a0f',
          card: '#13131a',
          subtle: '#1a1a24',
        },
        ink: {
          DEFAULT: '#e6e6f0',
          muted: '#9999ab',
          dim: '#5c5c70',
        },
        brand: {
          50:  '#f3f0ff',
          100: '#e9e3ff',
          200: '#d5caff',
          300: '#b8a4ff',
          400: '#9a73ff',
          500: '#7c5cff',  // DEFAULT
          600: '#6a3dff',
          700: '#5b3dd6',  // dim
          800: '#4b30b0',
          900: '#3b2580',
          DEFAULT: '#7c5cff',
          accent: '#ff9933',   // saffron
        },
        verdict: {
          'strong-buy': '#10b981',
          buy: '#34d399',
          hold: '#fbbf24',
          caution: '#f97316',
          avoid: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;

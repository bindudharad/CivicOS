/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          main: '#07111F',
          secondary: '#0A1625',
          elevated: '#101F30',
        },
        surface: {
          card: '#102235',
          elevated: '#142A3D',
          interactive: '#193249',
        },
        border: {
          standard: '#243B50',
          subtle: '#1B3043',
        },
        text: {
          primary: '#F0F6FC',
          secondary: '#A4B5C7',
          muted: '#73889D',
        },
        accent: {
          cyan: '#36D6CC',
          'deep-cyan': '#16A6B3',
          blue: '#5B9EFF',
          purple: '#8B5CF6',
        },
        status: {
          critical: '#FF5364',
          high: '#FF9955',
          medium: '#F3C767',
          low: '#46C99A',
          info: '#5B9EFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(54, 214, 204, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(54, 214, 204, 0.8), 0 0 40px rgba(54, 214, 204, 0.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

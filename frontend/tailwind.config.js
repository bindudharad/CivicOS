/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          midnight: '#080D1B',
          navy: '#101A32',
          elevated: '#172443',
          card: '#121D38',
          glass: 'rgba(16, 26, 50, 0.75)',
        },
        surface: {
          base: '#0B132B',
          card: '#121E3B',
          elevated: '#1A294C',
          hover: '#223663',
          border: 'rgba(57, 123, 255, 0.18)',
        },
        accent: {
          blue: '#397BFF',
          cyan: '#34D9E8',
          turquoise: '#35E5C5',
          violet: '#8B72FF',
          magenta: '#C26CFF',
        },
        severity: {
          critical: '#FF5577',
          high: '#FF9B55',
          medium: '#F4C76A',
          low: '#45D6A1',
          unassessed: '#64748B',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
          dim: '#475569',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.08)',
          standard: 'rgba(57, 123, 255, 0.22)',
          highlight: 'rgba(52, 217, 232, 0.45)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(52, 217, 232, 0.35)',
        'glow-blue': '0 0 25px -5px rgba(57, 123, 255, 0.35)',
        'glow-violet': '0 0 25px -5px rgba(139, 114, 255, 0.35)',
        'glow-critical': '0 0 25px -5px rgba(255, 85, 119, 0.4)',
        'card-elevated': '0 12px 32px -8px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(57, 123, 255, 0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'beacon': 'beacon 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        beacon: {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}

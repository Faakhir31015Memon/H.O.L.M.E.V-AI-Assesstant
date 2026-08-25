/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          cyan: '#00f3ff',
          blue: '#0055ff',
          amber: '#ffb700',
          dark: '#020813',
          darker: '#01040a',
          light: '#c5d3e8',
        }
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
        sharetech: ['Share Tech Mono', 'monospace'],
      },
      boxShadow: {
        'cyan-glow': '0 0 20px rgba(0, 243, 255, 0.4)',
        'cyan-glow-intense': '0 0 35px rgba(0, 243, 255, 0.75)',
        'blue-glow': '0 0 20px rgba(0, 85, 255, 0.3)',
        'amber-glow': '0 0 20px rgba(255, 183, 0, 0.5)',
        'amber-glow-intense': '0 0 35px rgba(255, 183, 0, 0.8)',
        'red-glow': '0 0 20px rgba(255, 60, 0, 0.4)',
        'red-glow-intense': '0 0 35px rgba(255, 60, 0, 0.8)',
        'inner-cyan': 'inset 0 0 15px rgba(0, 243, 255, 0.1)',
        'inner-blue': 'inset 0 0 15px rgba(0, 85, 255, 0.1)',
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
        'spin-reverse-slow': 'spin-reverse 15s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'spin-reverse': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        }
      }
    },
  },
  plugins: [],
}


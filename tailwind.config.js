/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pcb: {
          base: '#090D16',
          panel: '#111827',
          elevated: '#1E293B',
          trace: '#334155',
        },
        neon: {
          volt: '#00F0FF',   // Voltaje (V) - Cyan
          amp: '#FFB800',    // Corriente (I) - Amber
          ohm: '#FF2A85',    // Resistencia (R/Z) - Magenta
          watt: '#00FF66',   // Potencia / Éxito (P) - Matrix Green
          short: '#FF334B',  // Cortocircuito / Error - Plasma Red
        },
      },
      boxShadow: {
        'neon-volt': '0 0 15px rgba(0, 240, 255, 0.35)',
        'neon-watt': '0 0 15px rgba(0, 255, 102, 0.40)',
        'neon-short': '0 0 18px rgba(255, 51, 75, 0.45)',
      },
      fontFamily: {
        sans: ["'Inter'", "'Plus Jakarta Sans'", 'sans-serif'],
        display: ["'Space Grotesk'", "'Orbitron'", 'sans-serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
      },
    },
  },
  plugins: [],
}

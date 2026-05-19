/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './index.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  important: 'html',
  safelist: [
    { pattern: /^(bg|text|border)-(primary|secondary|tertiary|error|success|warning|info)-(50|100|200|300|400|500|600|700|800|900|950)$/ },
    { pattern: /^(bg|text|border)-sky-(50|100|200|300|400|500|600|700|800|900|950)$/ },
    { pattern: /^(bg|text|border)-amber-(50|100|200|300|400|500|600|700|800|900|950)$/ },
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand ──────────────────────────────────────────
        brand: {
          primary: '#0ea5e9',
          secondary: '#075985',
          accent: '#22d3ee',
        },
        accent: '#22d3ee',

        // ── Sky scale (primary identity Rototec) ───────────
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          450: '#1eb1f1',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },

        // ── Amber scale (acentos, advertencias) ────────────
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },

        // ── Semantic ───────────────────────────────────────
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        success: {
          50: 'rgb(202,255,232)',
          500: 'rgb(52,131,82)',
          950: 'rgb(27,50,36)',
          DEFAULT: '#16a34a',
        },
        warning: {
          50: 'rgb(255,244,236)',
          500: 'rgb(231,120,40)',
          950: 'rgb(84,45,18)',
          DEFAULT: '#d97706',
        },
        error: {
          50: 'rgb(254,226,226)',
          500: 'rgb(230,53,53)',
          950: 'rgb(83,19,19)',
          DEFAULT: '#dc2626',
        },
        info: {
          50: 'rgb(199,235,252)',
          500: 'rgb(13,166,242)',
          950: 'rgb(3,38,56)',
          DEFAULT: '#0891b2',
        },

        // ── Background tokens ──────────────────────────────
        background: {
          DEFAULT: '#FBFBFB',
          light: '#FBFBFB',
          dark: '#181719',
          muted: 'rgb(247,248,247)',
          error: 'rgb(254,241,241)',
          warning: 'rgb(255,243,234)',
          success: 'rgb(237,252,242)',
          info: 'rgb(235,248,254)',
        },

        // ── Text / Foreground ──────────────────────────────
        foreground: '#0f172a',
        muted: '#64748b',

        // ── Mezcla (estados de orden) ──────────────────────
        mezcla: {
          planificada: '#7c3aed',
          autorizada: '#0891b2',
          enProceso: '#b45309',
          completada: '#15803d',
          cancelada: '#6b7280',
          incompleta: '#b91c1c',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Roboto', 'System'],
        jakarta: ['Plus Jakarta Sans'],
        roboto: ['Roboto'],
        inter: ['Inter'],
        mono: ['Source Code Pro', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', '14px'],
      },
      fontWeight: {
        extrablack: '950',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        '2xl': '24px',
        sheet: '32px',
      },
      spacing: {
        1: '4px',
        1.5: '6px',
        2: '8px',
        2.5: '10px',
        3: '12px',
        3.5: '14px',
        4: '16px',
        4.5: '18px',
        5: '20px',
        6: '24px',
      },
      boxShadow: {
        'soft-1': '0 1px 2px rgba(0,0,0,0.04)',
        'soft-2': '0 2px 4px rgba(0,0,0,0.06)',
        'soft-3': '0 4px 8px rgba(0,0,0,0.08)',
        'soft-4': '0 8px 16px rgba(0,0,0,0.10)',
        'hard-1': '0 1px 3px rgba(0,0,0,0.12)',
        'hard-2': '0 2px 6px rgba(0,0,0,0.16)',
        'hard-3': '0 4px 10px rgba(0,0,0,0.20)',
        'hard-4': '0 8px 16px rgba(0,0,0,0.24)',
        'hard-5': '0 12px 24px rgba(0,0,0,0.30)',
      },
    },
  },
  plugins: [],
};

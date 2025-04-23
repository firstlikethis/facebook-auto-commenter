// client/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
      "./public/index.html",
    ],
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          primary: {
            50: '#eef2ff',
            100: '#e0e7ff',
            200: '#c7d2fe',
            300: '#a5b4fc',
            400: '#818cf8',
            500: '#6366f1',
            600: '#4f46e5',
            700: '#4338ca',
            800: '#3730a3',
            900: '#312e81',
          },
          secondary: {
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
          },
          success: {
            50: '#f0fdf4',
            500: '#22c55e',
            700: '#15803d',
          },
          warning: {
            50: '#fffbeb',
            500: '#f59e0b',
            700: '#b45309',
          },
          danger: {
            50: '#fef2f2',
            500: '#ef4444',
            700: '#b91c1c',
          },
          info: {
            50: '#eff6ff',
            500: '#3b82f6',
            700: '#1d4ed8',
          },
        },
        fontFamily: {
          sans: ['Sarabun', 'sans-serif'],
          mono: ['Fira Code', 'monospace'],
        },
        boxShadow: {
          card: '0 0 10px 0 rgba(0, 0, 0, 0.1)',
        },
      },
    },
    plugins: [],
  }
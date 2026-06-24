/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green:        '#2D6A4F',
          'green-dark': '#1B4332',
          'green-light':'#52B788',
          cream:        '#FDF6EC',
          'cream-dark': '#F5E6CC',
          amber:        '#C8893A',
          'amber-light':'#E9B87A',
          brown:        '#6B3F1E',
          'off-white':  '#FAFAF7',
        },
        neutral: {
          50:  '#FAFAF7',
          100: '#F5F0E8',
          200: '#E8E0D0',
          300: '#D0C8B5',
          400: '#A89F8C',
          500: '#7A7265',
          600: '#5C5548',
          700: '#3D3830',
          800: '#26221C',
          900: '#120F0A',
        },
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl':  '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft':  '0 2px 20px rgba(45,106,79,0.08)',
        'card':  '0 4px 40px rgba(45,106,79,0.10)',
        'hover': '0 8px 40px rgba(45,106,79,0.18)',
      },
    },
  },
  plugins: [],
}
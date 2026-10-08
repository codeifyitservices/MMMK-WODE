/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // fontFamily: {
      //   calmius: ["Calmius Sans", "sans-serif"],
      // },
      colors: {
        primary_dark: 'var(--primary-dark)',
        primary_light: 'var(--primary-light)',
        primary_olive: 'var(--primary-olive)',
      },
    },
  },
  plugins: [],
};

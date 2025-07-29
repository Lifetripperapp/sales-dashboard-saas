module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#F58220',      // naranja UYTECH
        'neutral-light': '#D3D0CD', // gris claro
        'neutral-dark': '#4A453F',  // gris oscuro
        background: '#FFFFFF',      // fondo blanco
      },
    },
  },
  plugins: [],
}; 
require('dotenv').config();
const app = require('./app');
const conectarDB = require('./config/db');

const PUERTO = process.env.PORT || 3000;

async function iniciar() {
  if (!process.env.JWT_SECRET) {
    throw new Error('Falta JWT_SECRET en el archivo .env');
  }
  await conectarDB();
  // 0.0.0.0 permite que el emulador de Android (10.0.2.2) y el celular en la misma red lleguen al servidor.
  app.listen(PUERTO, '0.0.0.0', () => console.log(`API escuchando en http://localhost:${PUERTO}`));
}

iniciar().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error.message);
  process.exit(1);
});

const express = require('express');
const { CATEGORIAS, INSTRUMENTO_TODOS, INSTRUMENTOS, ESTADOS_ASISTENCIA } = require('./utils/constantes');
const { rutaNoEncontrada, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(express.json({ limit: '100kb' }));

// Público: sirve para comprobar que el servidor está arriba.
app.get('/api/salud', (_req, res) => res.json({ estado: 'ok', servicio: 'api-escuela-musica-piendamo' }));

// Público: listas para los desplegables de la app (evita duplicar valores en Kotlin).
app.get('/api/catalogos', (_req, res) =>
  res.json({
    categorias: CATEGORIAS,
    instrumentos: INSTRUMENTOS,
    instrumentos_dirigidos: [INSTRUMENTO_TODOS, ...INSTRUMENTOS],
    estados_asistencia: ESTADOS_ASISTENCIA,
  })
);

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/actividades', require('./routes/actividades.routes'));
app.use('/api/inscripciones', require('./routes/inscripciones.routes'));

app.use(rutaNoEncontrada);
app.use(errorHandler);

module.exports = app;

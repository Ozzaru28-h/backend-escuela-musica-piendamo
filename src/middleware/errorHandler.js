const ApiError = require('../utils/ApiError');

/** 404 para rutas que no existen. */
function rutaNoEncontrada(req, _res, next) {
  next(ApiError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

/**
 * Único lugar donde se decide cómo se responde un error.
 * Formato siempre igual: { status, mensaje, detalles[] }
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  let status = 500;
  let mensaje = 'Error interno del servidor';
  let detalles = [];

  if (err instanceof ApiError) {
    ({ status, message: mensaje, detalles } = err);
  } else if (err.name === 'ValidationError') {
    status = 400;
    mensaje = 'Datos inválidos';
    detalles = Object.values(err.errors).map((e) => e.message);
  } else if (err.name === 'CastError') {
    status = 400;
    mensaje = `Valor inválido para "${err.path}"`;
  } else if (err.code === 11000) {
    status = 409;
    // Según la versión del servidor, el campo duplicado viene en keyPattern, keyValue o solo en el texto.
    const pista = `${JSON.stringify(err.keyPattern || err.keyValue || {})} ${err.message}`;
    if (pista.includes('numCelular') || pista.includes('.usuarios')) {
      mensaje = 'Ya existe un usuario registrado con ese celular';
    } else if (pista.includes('id_actividad') || pista.includes('.inscripciones')) {
      mensaje = 'El estudiante ya está inscrito en esta actividad';
    } else {
      mensaje = 'Ya existe un registro con esos datos';
    }
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    mensaje = 'El cuerpo de la petición no es un JSON válido';
  }

  if (status === 500) console.error(err);
  res.status(status).json({ status, mensaje, detalles });
}

module.exports = { rutaNoEncontrada, errorHandler };

const ApiError = require('./ApiError');

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

/** Envuelve un handler async para que cualquier error llegue al errorHandler. */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** ¿Es un texto? Bloquea objetos tipo {"$ne": ""} (inyección NoSQL). */
const esTexto = (valor) => typeof valor === 'string';

const esObjectId = (valor) => esTexto(valor) && OBJECT_ID.test(valor);

/** Devuelve solo los campos permitidos de un objeto (lista blanca). */
const tomarCampos = (origen, campos) =>
  campos.reduce((acc, campo) => {
    if (origen[campo] !== undefined) acc[campo] = origen[campo];
    return acc;
  }, {});

/** Lanza 400 si el valor no tiene forma de ObjectId. */
const exigirObjectId = (valor, nombreCampo) => {
  if (!esObjectId(valor)) {
    throw ApiError.badRequest(`"${nombreCampo}" no es un identificador válido`);
  }
};

module.exports = { asyncHandler, esTexto, esObjectId, tomarCampos, exigirObjectId };

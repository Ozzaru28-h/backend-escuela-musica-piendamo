const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

/** Exige un token "Authorization: Bearer <jwt>" válido y deja el usuario en req.usuario. */
function autenticar(req, _res, next) {
  const cabecera = req.headers.authorization || '';
  const [esquema, token] = cabecera.split(' ');
  if (esquema !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('Falta el token de autenticación'));
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: payload.sub, rol: payload.rol };
    return next();
  } catch {
    return next(ApiError.unauthorized('Token inválido o vencido'));
  }
}

/** Solo el director puede continuar. Va siempre DESPUÉS de autenticar. */
function soloDirector(req, _res, next) {
  if (req.usuario?.rol !== 'director') {
    return next(ApiError.forbidden('Solo el director puede realizar esta operación'));
  }
  return next();
}

module.exports = { autenticar, soloDirector };

/**
 * Error "esperado" de la API: lleva el código HTTP que se debe responder.
 * El manejador central (middleware/errorHandler.js) lo convierte en JSON.
 */
class ApiError extends Error {
  constructor(status, mensaje, detalles = []) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }

  static badRequest(mensaje, detalles) { return new ApiError(400, mensaje, detalles); }
  static unauthorized(mensaje = 'Debes iniciar sesión') { return new ApiError(401, mensaje); }
  static forbidden(mensaje = 'No tienes permiso para esta operación') { return new ApiError(403, mensaje); }
  static notFound(mensaje) { return new ApiError(404, mensaje); }
  static conflict(mensaje) { return new ApiError(409, mensaje); }
}

module.exports = ApiError;

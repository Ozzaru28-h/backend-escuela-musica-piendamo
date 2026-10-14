const { exigirObjectId } = require('../utils/helpers');

/** Valida que req.params[nombre] tenga forma de ObjectId antes de tocar la base de datos. */
const validarIdParam = (nombre = 'id') => (req, _res, next) => {
  try {
    exigirObjectId(req.params[nombre], nombre);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validarIdParam;

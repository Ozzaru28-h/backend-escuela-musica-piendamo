const { Router } = require('express');
const { asyncHandler } = require('../utils/helpers');
const { autenticar, soloDirector } = require('../middleware/auth');
const validarIdParam = require('../middleware/validarId');
const c = require('../controllers/inscripciones.controller');

const router = Router();

router.use(autenticar);

router.get('/', asyncHandler(c.listar));
router.post('/', asyncHandler(c.crear));
router.delete('/:id', validarIdParam(), asyncHandler(c.eliminar));
router.patch('/:id/asistencia', validarIdParam(), soloDirector, asyncHandler(c.registrarAsistencia));

module.exports = router;

const { Router } = require('express');
const { asyncHandler } = require('../utils/helpers');
const { autenticar, soloDirector } = require('../middleware/auth');
const validarIdParam = require('../middleware/validarId');
const c = require('../controllers/actividades.controller');

const router = Router();

router.use(autenticar); // todo lo de actividades requiere sesión

router.get('/', asyncHandler(c.listar));
router.get('/:id', validarIdParam(), asyncHandler(c.obtener));
router.get('/:id/resumen', validarIdParam(), soloDirector, asyncHandler(c.resumenAsistencia));
router.post('/', soloDirector, asyncHandler(c.crear));
router.put('/:id', validarIdParam(), soloDirector, asyncHandler(c.actualizar));
router.delete('/:id', validarIdParam(), soloDirector, asyncHandler(c.eliminar));

module.exports = router;

const { Router } = require('express');
const { asyncHandler } = require('../utils/helpers');
const { registrar, iniciarSesion } = require('../controllers/auth.controller');

const router = Router();

router.post('/registro', asyncHandler(registrar));
router.post('/login', asyncHandler(iniciarSesion));

module.exports = router;

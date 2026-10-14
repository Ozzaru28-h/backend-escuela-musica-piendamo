const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const ApiError = require('../utils/ApiError');
const { esTexto, tomarCampos } = require('../utils/helpers');

const RONDAS_HASH = 10;
const LONGITUD_MINIMA_CONTRASENA = 6;

const firmarToken = (usuario) =>
  jwt.sign({ rol: usuario.rol }, process.env.JWT_SECRET, {
    subject: usuario.id,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * POST /api/auth/registro
 * Siempre crea un ESTUDIANTE: el rol nunca se toma del body, así nadie se auto-nombra director.
 */
async function registrar(req, res) {
  const datos = tomarCampos(req.body, ['nombre', 'numCelular', 'categoria', 'instrumento']);
  const { contrasena } = req.body;

  if (!esTexto(contrasena) || contrasena.length < LONGITUD_MINIMA_CONTRASENA) {
    throw ApiError.badRequest('Datos inválidos', [
      `La contraseña debe tener al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres`,
    ]);
  }

  const usuario = await Usuario.create({
    ...datos,
    rol: 'estudiante',
    contrasena: await bcrypt.hash(contrasena, RONDAS_HASH),
  });

  res.status(201).json({ usuario, token: firmarToken(usuario) });
}

/** POST /api/auth/login — mismo mensaje para "no existe" y "clave incorrecta" (no revela cuál falló). */
async function iniciarSesion(req, res) {
  const { numCelular, contrasena } = req.body;
  if (!esTexto(numCelular) || !esTexto(contrasena)) {
    throw ApiError.badRequest('Datos inválidos', ['Debes enviar numCelular y contrasena como texto']);
  }

  const usuario = await Usuario.findOne({ numCelular }).select('+contrasena');
  const coincide = usuario && (await bcrypt.compare(contrasena, usuario.contrasena));
  if (!coincide) throw ApiError.unauthorized('Celular o contraseña incorrectos');

  res.json({ usuario, token: firmarToken(usuario) });
}

module.exports = { registrar, iniciarSesion };

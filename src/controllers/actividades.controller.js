const mongoose = require('mongoose');
const Actividad = require('../models/Actividad');
const Inscripcion = require('../models/Inscripcion');
const ApiError = require('../utils/ApiError');
const { CATEGORIAS, INSTRUMENTO_TODOS, ESTADOS_ASISTENCIA } = require('../utils/constantes');
const { esTexto, tomarCampos } = require('../utils/helpers');

const CAMPOS_EDITABLES = [
  'titulo', 'descripcion', 'categoria_dirigida', 'instrumento_dirigido',
  'fecha', 'hora', 'lugar', 'indicaciones_vestimenta', 'cupo_maximo',
];

/** Cuántos inscritos tiene cada actividad: { idActividad: n } */
async function contarInscritos(ids) {
  const grupos = await Inscripcion.aggregate([
    { $match: { id_actividad: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) } } },
    { $group: { _id: '$id_actividad', total: { $sum: 1 } } },
  ]);
  return Object.fromEntries(grupos.map((g) => [g._id.toString(), g.total]));
}

/** Actividad en JSON + cuántos inscritos tiene (la app lo muestra como "18 de 45"). */
const conInscritos = (actividad, conteo) => ({
  ...actividad.toJSON(),
  inscritos: conteo[actividad.id] ?? 0,
});

/**
 * GET /api/actividades?categoria=&instrumento=&fecha=
 * - categoria: solo actividades dirigidas a esa categoría (HU-02)
 * - instrumento: actividades para ese instrumento O para "Todos"
 */
async function listar(req, res) {
  const { categoria, instrumento, fecha } = req.query;
  const filtro = {};

  if (categoria !== undefined) {
    if (!CATEGORIAS.includes(categoria)) {
      throw ApiError.badRequest(`La categoría debe ser: ${CATEGORIAS.join(', ')}`);
    }
    filtro.categoria_dirigida = categoria;
  }
  if (instrumento !== undefined) {
    if (!esTexto(instrumento) || !instrumento.trim()) {
      throw ApiError.badRequest('El instrumento debe ser un texto');
    }
    filtro.instrumento_dirigido = { $in: [instrumento, INSTRUMENTO_TODOS] };
  }
  if (fecha !== undefined) {
    if (!esTexto(fecha) || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw ApiError.badRequest('La fecha debe tener formato AAAA-MM-DD');
    }
    filtro.fecha = fecha;
  }

  const actividades = await Actividad.find(filtro).sort({ fecha: 1, hora: 1 });
  const conteo = await contarInscritos(actividades.map((a) => a.id));
  res.json(actividades.map((a) => conInscritos(a, conteo)));
}

/** GET /api/actividades/:id */
async function obtener(req, res) {
  const actividad = await Actividad.findById(req.params.id);
  if (!actividad) throw ApiError.notFound('La actividad no existe');
  res.json(conInscritos(actividad, await contarInscritos([actividad.id])));
}

/** POST /api/actividades (solo director). El creador sale del token, no del body. */
async function crear(req, res) {
  const actividad = await Actividad.create({
    ...tomarCampos(req.body, CAMPOS_EDITABLES),
    id_usuario: req.usuario.id,
  });
  res.status(201).json(conInscritos(actividad, {}));
}

/**
 * PUT /api/actividades/:id (solo director). Reemplazo completo: lo que no se envía se borra,
 * y los campos obligatorios se vuelven a validar.
 */
async function actualizar(req, res) {
  const actividad = await Actividad.findById(req.params.id);
  if (!actividad) throw ApiError.notFound('La actividad no existe');

  const inscritos = await Inscripcion.countDocuments({ id_actividad: actividad._id });
  const nuevos = tomarCampos(req.body, CAMPOS_EDITABLES);

  // Cambiar el público objetivo con gente ya inscrita dejaría inscripciones incongruentes.
  const cambiaPublico =
    nuevos.categoria_dirigida !== actividad.categoria_dirigida ||
    nuevos.instrumento_dirigido !== actividad.instrumento_dirigido;
  if (inscritos > 0 && cambiaPublico) {
    throw ApiError.conflict(
      `No se puede cambiar la categoría o el instrumento: ya hay ${inscritos} estudiante(s) inscrito(s)`
    );
  }
  if (nuevos.cupo_maximo !== undefined && inscritos > nuevos.cupo_maximo) {
    throw ApiError.conflict(
      `El cupo máximo no puede ser menor que los ${inscritos} inscritos actuales`
    );
  }

  CAMPOS_EDITABLES.forEach((campo) => { actividad[campo] = req.body[campo]; });
  await actividad.save();
  res.json(conInscritos(actividad, { [actividad.id]: inscritos }));
}

/** DELETE /api/actividades/:id (solo director). Borra también sus inscripciones. */
async function eliminar(req, res) {
  const actividad = await Actividad.findById(req.params.id);
  if (!actividad) throw ApiError.notFound('La actividad no existe');

  await Inscripcion.deleteMany({ id_actividad: actividad._id });
  await actividad.deleteOne();
  res.status(204).send();
}

/** GET /api/actividades/:id/resumen — totales de asistencia (HU-06, CA-03). */
async function resumenAsistencia(req, res) {
  const actividad = await Actividad.findById(req.params.id);
  if (!actividad) throw ApiError.notFound('La actividad no existe');

  const grupos = await Inscripcion.aggregate([
    { $match: { id_actividad: actividad._id } },
    { $group: { _id: '$estado_asistencia', total: { $sum: 1 } } },
  ]);
  const porEstado = Object.fromEntries(ESTADOS_ASISTENCIA.map((e) => [e, 0]));
  grupos.forEach((g) => { porEstado[g._id] = g.total; });

  res.json({
    id_actividad: actividad.id,
    total_inscritos: Object.values(porEstado).reduce((a, b) => a + b, 0),
    cupo_maximo: actividad.cupo_maximo ?? null,
    por_estado: porEstado,
  });
}

module.exports = { listar, obtener, crear, actualizar, eliminar, resumenAsistencia };

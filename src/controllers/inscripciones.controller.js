const Actividad = require('../models/Actividad');
const Inscripcion = require('../models/Inscripcion');
const Usuario = require('../models/Usuario');
const ApiError = require('../utils/ApiError');
const { ESTADOS_ASISTENCIA, INSTRUMENTO_TODOS } = require('../utils/constantes');
const { esObjectId, exigirObjectId, esTexto } = require('../utils/helpers');

const POPULAR = [
  { path: 'id_estudiante', select: 'nombre categoria instrumento' },
  { path: 'id_actividad', select: 'titulo fecha hora lugar' },
];

/**
 * Convierte una inscripción con populate a un JSON plano y estable para la app:
 * conserva id_actividad / id_estudiante como texto y agrega "estudiante" y "actividad".
 */
function aplanar(inscripcion) {
  const est = inscripcion.id_estudiante;
  const act = inscripcion.id_actividad;
  return {
    id: inscripcion.id,
    id_actividad: act ? act.id : null,
    id_estudiante: est ? est.id : null,
    fecha_registro: inscripcion.fecha_registro,
    estado_asistencia: inscripcion.estado_asistencia,
    estudiante: est
      ? { id: est.id, nombre: est.nombre, categoria: est.categoria, instrumento: est.instrumento }
      : null,
    actividad: act
      ? { id: act.id, titulo: act.titulo, fecha: act.fecha, hora: act.hora, lugar: act.lugar ?? null }
      : null,
  };
}

/** GET /api/inscripciones?id_actividad=&id_estudiante= — el estudiante solo ve las suyas. */
async function listar(req, res) {
  const { id_actividad: idActividad, id_estudiante: idEstudiante } = req.query;
  const filtro = {};

  if (idActividad !== undefined) {
    exigirObjectId(idActividad, 'id_actividad');
    filtro.id_actividad = idActividad;
  }
  if (idEstudiante !== undefined) {
    exigirObjectId(idEstudiante, 'id_estudiante');
    filtro.id_estudiante = idEstudiante;
  }
  if (req.usuario.rol === 'estudiante') filtro.id_estudiante = req.usuario.id;

  const inscripciones = await Inscripcion.find(filtro).populate(POPULAR).sort({ fecha_registro: 1 });
  res.json(inscripciones.map(aplanar));
}

/**
 * POST /api/inscripciones — AQUÍ VIVE LA REGLA DE NEGOCIO.
 * Valida, en orden: forma de los datos → existencia → congruencia de perfil → duplicado → cupo.
 */
async function crear(req, res) {
  const { id_actividad: idActividad } = req.body;
  let { id_estudiante: idEstudiante } = req.body;

  // El estudiante solo puede inscribirse a sí mismo; si no envía id_estudiante se usa el del token.
  if (req.usuario.rol === 'estudiante') {
    if (idEstudiante === undefined) idEstudiante = req.usuario.id;
    if (idEstudiante !== req.usuario.id) {
      throw ApiError.forbidden('Solo puedes inscribirte a ti mismo');
    }
  }
  const errores = [];
  if (!esObjectId(idActividad)) errores.push('"id_actividad" es obligatorio y debe ser un identificador válido');
  if (!esObjectId(idEstudiante)) errores.push('"id_estudiante" es obligatorio y debe ser un identificador válido');
  if (errores.length) throw ApiError.badRequest('Datos inválidos', errores);

  const actividad = await Actividad.findById(idActividad);
  if (!actividad) throw ApiError.notFound('La actividad no existe');

  const estudiante = await Usuario.findById(idEstudiante);
  if (!estudiante) throw ApiError.notFound('El estudiante no existe');
  if (estudiante.rol !== 'estudiante') {
    throw ApiError.badRequest('Solo los estudiantes pueden inscribirse a una actividad');
  }

  // Regla de negocio: congruencia de perfiles (categoría e instrumento).
  if (estudiante.categoria !== actividad.categoria_dirigida) {
    throw ApiError.conflict(
      `Esta actividad es para la categoría "${actividad.categoria_dirigida}" ` +
      `y el estudiante es de "${estudiante.categoria}"`
    );
  }
  const abiertaATodos = actividad.instrumento_dirigido === INSTRUMENTO_TODOS;
  if (!abiertaATodos && estudiante.instrumento !== actividad.instrumento_dirigido) {
    throw ApiError.conflict(
      `Esta actividad es para "${actividad.instrumento_dirigido}" ` +
      `y el estudiante toca "${estudiante.instrumento}"`
    );
  }

  const yaInscrito = await Inscripcion.exists({ id_actividad: actividad._id, id_estudiante: estudiante._id });
  if (yaInscrito) throw ApiError.conflict('El estudiante ya está inscrito en esta actividad');

  if (actividad.cupo_maximo !== undefined && actividad.cupo_maximo !== null) {
    const inscritos = await Inscripcion.countDocuments({ id_actividad: actividad._id });
    if (inscritos >= actividad.cupo_maximo) {
      throw ApiError.conflict(`La actividad ya no tiene cupos (${actividad.cupo_maximo} de ${actividad.cupo_maximo})`);
    }
  }

  const inscripcion = await Inscripcion.create({ id_actividad: actividad._id, id_estudiante: estudiante._id });
  await inscripcion.populate(POPULAR);
  res.status(201).json(aplanar(inscripcion));
}

/** DELETE /api/inscripciones/:id — el dueño la cancela; el director puede quitar a cualquiera. */
async function eliminar(req, res) {
  const inscripcion = await Inscripcion.findById(req.params.id);
  if (!inscripcion) throw ApiError.notFound('La inscripción no existe');

  const esDueno = inscripcion.id_estudiante.toString() === req.usuario.id;
  if (req.usuario.rol !== 'director' && !esDueno) {
    throw ApiError.forbidden('Solo puedes cancelar tus propias inscripciones');
  }
  await inscripcion.deleteOne();
  res.status(204).send();
}

/** PATCH /api/inscripciones/:id/asistencia (solo director) */
async function registrarAsistencia(req, res) {
  const { estado_asistencia: estado } = req.body;
  if (!esTexto(estado) || !ESTADOS_ASISTENCIA.includes(estado)) {
    throw ApiError.badRequest(`El estado de asistencia debe ser: ${ESTADOS_ASISTENCIA.join(', ')}`);
  }

  const inscripcion = await Inscripcion.findByIdAndUpdate(
    req.params.id,
    { estado_asistencia: estado },
    { new: true, runValidators: true }
  ).populate(POPULAR);
  if (!inscripcion) throw ApiError.notFound('La inscripción no existe');

  res.json(aplanar(inscripcion));
}

module.exports = { listar, crear, eliminar, registrarAsistencia };

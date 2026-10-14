/**
 * Catálogos del dominio. Viven en un solo lugar para que el modelo, las
 * validaciones y el endpoint /api/catalogos usen exactamente los mismos valores.
 */
const CATEGORIAS = ['Banda', 'Pre-banda', 'Semillero'];

const INSTRUMENTO_TODOS = 'Todos';

const INSTRUMENTOS = [
  'Clarinete', 'Flauta', 'Oboe', 'Saxofón', 'Trompeta', 'Trombón',
  'Corno', 'Eufonio', 'Tuba', 'Percusión', 'Violín', 'Violonchelo',
];

const ROLES = ['director', 'estudiante'];

const ESTADOS_ASISTENCIA = ['Pendiente', 'Asistió', 'Faltó', 'Justificado'];

module.exports = {
  CATEGORIAS,
  INSTRUMENTO_TODOS,
  INSTRUMENTOS,
  ROLES,
  ESTADOS_ASISTENCIA,
};

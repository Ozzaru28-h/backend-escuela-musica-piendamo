/**
 * Carga datos de PRUEBA (anonimizados). ATENCIÓN: borra las colecciones antes de insertar.
 * Uso: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const conectarDB = require('../config/db');
const Usuario = require('../models/Usuario');
const Actividad = require('../models/Actividad');
const Inscripcion = require('../models/Inscripcion');

const CONTRASENA_PRUEBA = 'Prueba123';

async function sembrar() {
  await conectarDB();
  await Promise.all([Inscripcion.deleteMany({}), Actividad.deleteMany({}), Usuario.deleteMany({})]);
  await Usuario.syncIndexes();
  await Inscripcion.syncIndexes();

  const contrasena = await bcrypt.hash(CONTRASENA_PRUEBA, 10);
  const [director, sofia, mateo, valentina] = await Usuario.create([
    { nombre: 'Director de Prueba', numCelular: '3000000000', contrasena, rol: 'director' },
    { nombre: 'Sofía de Prueba', numCelular: '3000000001', contrasena, categoria: 'Banda', instrumento: 'Clarinete' },
    { nombre: 'Mateo de Prueba', numCelular: '3000000002', contrasena, categoria: 'Banda', instrumento: 'Trompeta' },
    { nombre: 'Valentina de Prueba', numCelular: '3000000003', contrasena, categoria: 'Semillero', instrumento: 'Flauta' },
  ]);

  const [ensayo, tallerClarinetes] = await Actividad.create([
    {
      titulo: 'Ensayo General', descripcion: 'Ensayo previo al concierto de fin de temporada',
      categoria_dirigida: 'Banda', instrumento_dirigido: 'Todos', fecha: '2026-11-20', hora: '16:00',
      lugar: 'Auditorio Principal', indicaciones_vestimenta: 'Camisa negra de ensayo',
      cupo_maximo: 45, id_usuario: director._id,
    },
    {
      titulo: 'Taller de Clarinetes', descripcion: 'Técnica de embocadura y articulación',
      categoria_dirigida: 'Banda', instrumento_dirigido: 'Clarinete', fecha: '2026-11-21', hora: '10:00',
      lugar: 'Aula 3', cupo_maximo: 2, id_usuario: director._id,
    },
    {
      titulo: 'Técnica de Afinación y Escalas', descripcion: 'Práctica de escalas y afinación grupal',
      categoria_dirigida: 'Semillero', instrumento_dirigido: 'Todos', fecha: '2026-11-22', hora: '09:00',
      lugar: 'Aula 1', id_usuario: director._id,
    },
    {
      titulo: 'Seccional de Maderas', descripcion: 'Ensayo por secciones de vientos madera',
      categoria_dirigida: 'Pre-banda', instrumento_dirigido: 'Todos', fecha: '2026-11-23', hora: '15:00',
      lugar: 'Salón de Ensayos B', id_usuario: director._id,
    },
  ]);

  await Inscripcion.create([
    { id_actividad: ensayo._id, id_estudiante: sofia._id },
    { id_actividad: ensayo._id, id_estudiante: mateo._id },
    { id_actividad: tallerClarinetes._id, id_estudiante: sofia._id },
  ]);

  console.log('Datos de prueba cargados.');
  console.log(`Director: 3000000000 / ${CONTRASENA_PRUEBA}`);
  console.log(`Estudiantes: 3000000001 (Banda, Clarinete), 3000000002 (Banda, Trompeta), 3000000003 (Semillero, Flauta) / ${CONTRASENA_PRUEBA}`);
  await mongoose.disconnect();
}

sembrar().catch(async (error) => {
  console.error('Error al sembrar:', error);
  await mongoose.disconnect();
  process.exit(1);
});

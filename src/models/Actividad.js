const { Schema, model } = require('mongoose');
const { CATEGORIAS, INSTRUMENTO_TODOS, INSTRUMENTOS } = require('../utils/constantes');

const INSTRUMENTOS_VALIDOS = [INSTRUMENTO_TODOS, ...INSTRUMENTOS];

/** "2026-11-20" debe existir de verdad (rechaza 2026-02-31). */
const fechaReal = (valor) => {
  const d = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(valor);
};

const actividadSchema = new Schema(
  {
    titulo: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      minlength: [3, 'El título debe tener al menos 3 caracteres'],
      maxlength: [100, 'El título no puede superar 100 caracteres'],
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      trim: true,
      maxlength: [500, 'La descripción no puede superar 500 caracteres'],
    },
    categoria_dirigida: {
      type: String,
      required: [true, 'La categoría dirigida es obligatoria'],
      enum: { values: CATEGORIAS, message: 'La categoría debe ser: ' + CATEGORIAS.join(', ') },
    },
    instrumento_dirigido: {
      type: String,
      required: [true, 'El instrumento dirigido es obligatorio ("Todos" o uno específico)'],
      enum: {
        values: INSTRUMENTOS_VALIDOS,
        message: 'El instrumento debe ser: ' + INSTRUMENTOS_VALIDOS.join(', '),
      },
    },
    // Se guardan como texto ISO ("2026-11-20" y "16:00"): ordenan bien y no sufren por zonas horarias.
    fecha: {
      type: String,
      required: [true, 'La fecha es obligatoria'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato AAAA-MM-DD'],
      validate: { validator: fechaReal, message: 'La fecha no existe en el calendario' },
    },
    hora: {
      type: String,
      required: [true, 'La hora es obligatoria'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'La hora debe tener formato HH:MM (24 horas)'],
    },
    lugar: { type: String, trim: true, maxlength: [120, 'El lugar no puede superar 120 caracteres'] },
    indicaciones_vestimenta: {
      type: String,
      trim: true,
      maxlength: [200, 'Las indicaciones de vestimenta no pueden superar 200 caracteres'],
    },
    // Opcional. Si no se envía, la actividad no tiene límite de cupos.
    cupo_maximo: {
      type: Number,
      min: [1, 'El cupo máximo debe ser al menos 1'],
      validate: { validator: Number.isInteger, message: 'El cupo máximo debe ser un número entero' },
    },
    id_usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        ret.id_usuario = ret.id_usuario?.toString();
        delete ret._id;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
      },
    },
  }
);

actividadSchema.index({ categoria_dirigida: 1, fecha: 1, hora: 1 });

module.exports = model('Actividad', actividadSchema);

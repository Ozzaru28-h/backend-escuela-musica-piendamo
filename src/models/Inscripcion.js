const { Schema, model } = require('mongoose');
const { ESTADOS_ASISTENCIA } = require('../utils/constantes');

const inscripcionSchema = new Schema(
  {
    id_actividad: { type: Schema.Types.ObjectId, ref: 'Actividad', required: true },
    id_estudiante: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    fecha_registro: { type: Date, default: Date.now },
    estado_asistencia: {
      type: String,
      enum: {
        values: ESTADOS_ASISTENCIA,
        message: 'El estado de asistencia debe ser: ' + ESTADOS_ASISTENCIA.join(', '),
      },
      default: 'Pendiente',
    },
  },
  {
    toJSON: {
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        ret.id_actividad = ret.id_actividad?.toString();
        ret.id_estudiante = ret.id_estudiante?.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

// Un estudiante no puede inscribirse dos veces a la misma actividad (lo garantiza la base de datos).
inscripcionSchema.index({ id_actividad: 1, id_estudiante: 1 }, { unique: true });
inscripcionSchema.index({ id_estudiante: 1 });

module.exports = model('Inscripcion', inscripcionSchema);

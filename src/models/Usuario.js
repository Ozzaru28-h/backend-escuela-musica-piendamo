const { Schema, model } = require('mongoose');
const { CATEGORIAS, ROLES, INSTRUMENTOS } = require('../utils/constantes');

const esEstudiante = function () { return this.rol === 'estudiante'; };

const usuarioSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [80, 'El nombre no puede superar 80 caracteres'],
    },
    numCelular: {
      type: String,
      required: [true, 'El celular es obligatorio'],
      unique: true,
      trim: true,
      match: [/^\d{10}$/, 'El celular debe tener 10 dígitos'],
    },
    // Aquí se guarda el HASH (bcrypt), nunca la contraseña. select:false => no sale en las consultas.
    contrasena: { type: String, required: true, select: false },
    rol: {
      type: String,
      enum: { values: ROLES, message: 'El rol debe ser: ' + ROLES.join(', ') },
      default: 'estudiante',
    },
    categoria: {
      type: String,
      enum: { values: CATEGORIAS, message: 'La categoría debe ser: ' + CATEGORIAS.join(', ') },
      required: [esEstudiante, 'La categoría es obligatoria para estudiantes'],
    },
    instrumento: {
      type: String,
      enum: { values: INSTRUMENTOS, message: 'El instrumento debe ser: ' + INSTRUMENTOS.join(', ') },
      required: [esEstudiante, 'El instrumento es obligatorio para estudiantes'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.contrasena;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
      },
    },
  }
);

module.exports = model('Usuario', usuarioSchema);

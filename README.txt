# API REST · Escuela de Música de Piendamó

Backend del proyecto individual de **Desarrollo de Aplicaciones Móviles** (Ingeniería de Software y Computación, Uniautónoma del Cauca).
Gestiona la programación de clases y ensayos (**Actividades**), las **Inscripciones** de estudiantes y el registro de **asistencia**, validando en el servidor que cada estudiante solo entre a los espacios que le corresponden.

**Stack:** Node.js 18+ · Express 4 · MongoDB · Mongoose 8 · JWT (jsonwebtoken) · bcryptjs.

---

## 1. Requisitos

- Node.js 18.11 o superior (`node -v`)
- MongoDB Community local **o** una cuenta gratuita de MongoDB Atlas
- VS Code (opcional pero recomendado) y Postman o Insomnia

## 2. Instalación y ejecución

```bash
cd backend
npm install
cp .env.example .env        # en Windows: copy .env.example .env
# edita .env: MONGODB_URI y JWT_SECRET
npm run seed                # carga datos de prueba (BORRA las colecciones)
npm run dev                 # servidor con recarga automática
```

Debe aparecer: `MongoDB conectado: escuela_musica_piendamo` y `API escuchando en http://localhost:3000`.
Comprueba con: `GET http://localhost:3000/api/salud`.

**Variables de entorno (`.env`)**

| Variable | Para qué sirve |
|---|---|
| `PORT` | Puerto del servidor (3000 por defecto) |
| `MONGODB_URI` | Cadena de conexión. Local: `mongodb://127.0.0.1:27017/escuela_musica_piendamo` |
| `JWT_SECRET` | Secreto para firmar los tokens. Cámbialo por una cadena larga y aleatoria |
| `JWT_EXPIRES_IN` | Vigencia del token (7d por defecto) |

**Usuarios de prueba** (creados por `npm run seed`, datos ficticios, contraseña `Prueba123`):

| Rol | Celular | Perfil |
|---|---|---|
| director | 3000000000 | — |
| estudiante | 3000000001 | Banda · Clarinete |
| estudiante | 3000000002 | Banda · Trompeta |
| estudiante | 3000000003 | Semillero · Flauta |

## 3. Colección de pruebas

`postman/EscuelaMusicaPiendamo.postman_collection.json` (importable también en Insomnia).

1. `npm run seed` (deja la base en un estado conocido).
2. Importa la colección en Postman → **Runner** → ejecuta la colección completa **en orden**.
3. Son 48 peticiones con 77 verificaciones automáticas (códigos HTTP, cuerpo de la respuesta y mensajes de error). Las pruebas encadenan variables (tokens e ids) y generan celulares aleatorios, así que se pueden repetir sin limpiar la base.

Desde consola: `npx newman run postman/EscuelaMusicaPiendamo.postman_collection.json`

## 4. Endpoints

Autenticación: encabezado `Authorization: Bearer <token>` (se obtiene en login/registro).

| # | Método y ruta | Quién | Descripción | Éxito |
|---|---|---|---|---|
| 1 | `GET /api/salud` | público | Estado del servidor | 200 |
| 2 | `GET /api/catalogos` | público | Categorías, instrumentos y estados (para los desplegables de la app) | 200 |
| 3 | `POST /api/auth/registro` | público | Crea un **estudiante** y devuelve su token | 201 |
| 4 | `POST /api/auth/login` | público | Inicia sesión con `numCelular` y `contrasena` | 200 |
| 5 | `GET /api/actividades` | autenticado | Lista. Filtros: `?categoria=`, `?instrumento=`, `?fecha=AAAA-MM-DD` | 200 |
| 6 | `GET /api/actividades/{id}` | autenticado | Detalle (incluye `inscritos`) | 200 |
| 7 | `POST /api/actividades` | director | Crea una actividad | 201 |
| 8 | `PUT /api/actividades/{id}` | director | Reemplaza una actividad | 200 |
| 9 | `DELETE /api/actividades/{id}` | director | Elimina la actividad y sus inscripciones | 204 |
| 10 | `GET /api/actividades/{id}/resumen` | director | Totales de asistencia por estado | 200 |
| 11 | `GET /api/inscripciones` | autenticado | Lista. Filtros: `?id_actividad=`, `?id_estudiante=` (el estudiante solo ve las suyas) | 200 |
| 12 | `POST /api/inscripciones` | autenticado | Inscribe a un estudiante (**aplica la regla de negocio**) | 201 |
| 13 | `DELETE /api/inscripciones/{id}` | dueño o director | Cancela / remueve la inscripción | 204 |
| 14 | `PATCH /api/inscripciones/{id}/asistencia` | director | Marca `Pendiente`, `Asistió`, `Faltó` o `Justificado` | 200 |

### Ejemplos

`POST /api/actividades`
```json
{
  "titulo": "Ensayo General",
  "descripcion": "Ensayo previo al concierto",
  "categoria_dirigida": "Banda",
  "instrumento_dirigido": "Todos",
  "fecha": "2026-11-20",
  "hora": "16:00",
  "lugar": "Auditorio Principal",
  "indicaciones_vestimenta": "Camisa negra",
  "cupo_maximo": 45
}
```
Obligatorios: `titulo`, `descripcion`, `categoria_dirigida`, `instrumento_dirigido`, `fecha`, `hora`. Opcionales: `lugar`, `indicaciones_vestimenta`, `cupo_maximo`. El creador (`id_usuario`) se toma del token, no del cuerpo.

`POST /api/inscripciones`
```json
{ "id_actividad": "6acec3c5b5691ae50c828d5e", "id_estudiante": "6acec38ad834c8368bbd2c82" }
```
Un estudiante puede omitir `id_estudiante` (se usa el de su token) pero no puede inscribir a otra persona.

## 5. Reglas de negocio (validadas en el servidor)

1. **Congruencia de perfiles** (regla principal, `POST /api/inscripciones`): la categoría del estudiante debe ser igual a `categoria_dirigida` y su instrumento debe ser igual a `instrumento_dirigido` (o la actividad debe ser para `"Todos"`). Si no coincide → **409** con el motivo, por ejemplo: `Esta actividad es para la categoría "Banda" y el estudiante es de "Semillero"`.
2. **Sin inscripciones duplicadas**: un estudiante no se inscribe dos veces a la misma actividad → **409** (también garantizado por un índice único en la base de datos).
3. **Cupo máximo**: si la actividad define `cupo_maximo` y ya está lleno → **409**.
4. **Integridad al editar**: no se puede cambiar la categoría o el instrumento de una actividad con inscritos, ni bajar el cupo por debajo de los inscritos → **409**.
5. **Permisos por rol**: solo el director crea, edita y elimina actividades, marca asistencia y ve el resumen; el estudiante solo se inscribe y cancela a sí mismo.

## 6. Códigos HTTP y formato de error

| Código | Cuándo |
|---|---|
| 200 / 201 / 204 | Éxito (lectura-actualización / creación / eliminación sin cuerpo) |
| 400 | Datos inválidos (campos faltantes, formato, enum, id mal formado, JSON roto) |
| 401 | Sin token, token inválido o vencido, credenciales incorrectas |
| 403 | Rol o propiedad insuficiente |
| 404 | Recurso o ruta inexistente |
| 409 | Conflicto con una regla de negocio o dato duplicado |
| 500 | Error inesperado (el detalle solo se imprime en el log del servidor) |

Todos los errores tienen la misma forma:
```json
{ "status": 409, "mensaje": "La actividad ya no tiene cupos (1 de 1)", "detalles": [] }
```
En los 400 de validación, `detalles` lista cada campo con problema (la app puede mostrarlos tal cual).

## 7. Modelo de datos (MongoDB)

Base: `escuela_musica_piendamo` · Colecciones: `usuarios`, `actividades`, `inscripciones`.

**usuarios**
| Campo | Tipo | Reglas |
|---|---|---|
| `_id` | ObjectId | PK (la API lo expone como `id`, texto) |
| `nombre` | String | obligatorio, 2–80 |
| `numCelular` | String | obligatorio, **único**, 10 dígitos |
| `contrasena` | String | hash bcrypt; nunca se devuelve |
| `rol` | String | `director` \| `estudiante` |
| `categoria` | String | `Banda` \| `Pre-banda` \| `Semillero` (obligatoria si es estudiante) |
| `instrumento` | String | uno del catálogo (obligatorio si es estudiante) |

**actividades**
| Campo | Tipo | Reglas |
|---|---|---|
| `_id` | ObjectId | PK |
| `titulo` | String | obligatorio, 3–100 |
| `descripcion` | String | obligatorio, máx. 500 |
| `categoria_dirigida` | String | obligatorio, enum de categorías |
| `instrumento_dirigido` | String | obligatorio, `Todos` o un instrumento del catálogo |
| `fecha` | String | `AAAA-MM-DD`, debe existir en el calendario |
| `hora` | String | `HH:MM` (24 h) |
| `lugar`, `indicaciones_vestimenta` | String | opcionales |
| `cupo_maximo` | Number | opcional, entero ≥ 1 |
| `id_usuario` | ObjectId → usuarios | director que la creó |

**inscripciones**
| Campo | Tipo | Reglas |
|---|---|---|
| `_id` | ObjectId | PK |
| `id_actividad` | ObjectId → actividades | obligatorio |
| `id_estudiante` | ObjectId → usuarios | obligatorio |
| `fecha_registro` | Date | por defecto, ahora |
| `estado_asistencia` | String | `Pendiente` (defecto) \| `Asistió` \| `Faltó` \| `Justificado` |

Relaciones: un usuario (director) crea muchas actividades; una actividad tiene muchas inscripciones; un usuario (estudiante) tiene muchas inscripciones.
Índices: único `(id_actividad, id_estudiante)`; `(categoria_dirigida, fecha, hora)`; `numCelular` único.

## 8. Estructura del proyecto

```
backend/
├─ src/
│  ├─ server.js              # arranque: conecta la BD y levanta Express
│  ├─ app.js                 # configura Express y monta las rutas
│  ├─ config/db.js           # conexión a MongoDB
│  ├─ models/                # esquemas Mongoose (Usuario, Actividad, Inscripcion)
│  ├─ routes/                # qué URL llama a qué controlador (+ permisos)
│  ├─ controllers/           # lógica y reglas de negocio
│  ├─ middleware/            # autenticación, validación de id, manejo de errores
│  ├─ utils/                 # catálogos, ApiError, helpers
│  └─ seed/seed.js           # datos de prueba
├─ postman/                  # colección con pruebas automáticas
├─ .env.example
└─ README.md
```
Flujo de una petición: `ruta → middleware (token / rol / id) → controlador (reglas) → modelo (validación y persistencia) → errorHandler si algo falla`.

## 9. Conectar la app Android (Etapa 4)

- Emulador: la URL base es `http://10.0.2.2:3000/` (10.0.2.2 es el "localhost" de tu computador visto desde el emulador). Celular físico: la IP de tu computador en la misma red Wi-Fi.
- Permiso en `AndroidManifest.xml`: `<uses-permission android:name="android.permission.INTERNET" />`.
- Como la API local usa HTTP (no HTTPS), en desarrollo agrega `android:usesCleartextTraffic="true"` en `<application>`.
- Los `id` son **texto** (ObjectId de MongoDB): en Kotlin usa `String`, no `Int`.
- Cada petición (menos login/registro/catálogos) lleva `Authorization: Bearer <token>`; guarda el token tras el login.

## 10. Decisiones y limitaciones conocidas

- **Fecha y hora como texto ISO**: ordenan bien y evitan problemas de zona horaria; la validación de calendario se hace en el modelo.
- **Sin transacciones**: al eliminar una actividad se borran primero sus inscripciones y luego la actividad. Un MongoDB local sin réplica no soporta transacciones; el riesgo es mínimo en este alcance.
- **Cupo bajo concurrencia**: la verificación de cupo es "contar y luego insertar"; con dos inscripciones simultáneas al último cupo podrían entrar ambas. Para este alcance se acepta; la solución de producción sería un contador atómico (`$inc` condicionado).
- **Registro público solo crea estudiantes**: el director se crea con el seed (o directamente en la base). Así nadie puede auto-asignarse el rol.
- **Seguridad básica**: contraseñas con bcrypt, token con vencimiento, listas blancas de campos, y rechazo de objetos en filtros y login (defensa contra inyección NoSQL).

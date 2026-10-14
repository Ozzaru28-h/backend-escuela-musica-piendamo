# Guía de estudio para la sustentación del backend

La guía dice que el docente puede pedir "operaciones no preparadas": crear, modificar, eliminar, provocar una validación, explicar un endpoint o mostrar un 404/400. Practica cada una con Postman **sin mirar este documento**.

## 1. Recorrido de una petición (sabértelo de memoria)
`POST /api/inscripciones` → `app.js` (parsea el JSON) → `inscripciones.routes.js` (¿hay token? `autenticar`) → `inscripciones.controller.js › crear` (valida ids, busca actividad y estudiante, compara categoría e instrumento, revisa duplicado y cupo) → `Inscripcion.create` (Mongoose valida y guarda) → respuesta 201. Si algo falla en cualquier punto, el error viaja a `errorHandler.js`, que responde siempre con `{ status, mensaje, detalles }`.

## 2. Preguntas probables
1. **¿Dónde está la regla de negocio y por qué en el backend?** En `crear` de `inscripciones.controller.js`. Si estuviera solo en la app, cualquiera podría saltarla llamando a la API directamente (Postman, otra app).
2. **¿Por qué 409 y no 400?** 400 = la petición está mal formada; 409 = está bien formada pero choca con el estado/reglas del sistema.
3. **¿Qué diferencia hay entre PUT y PATCH?** PUT reemplaza el recurso completo (por eso un PUT sin campos obligatorios da 400); PATCH cambia solo un campo (la asistencia).
4. **¿Por qué DELETE devuelve 204?** Se eliminó y no hay nada que devolver.
5. **¿Para qué sirve el token JWT?** Identifica quién llama y su rol sin guardar sesión en el servidor. El `id_usuario` de una actividad sale del token, no del cuerpo, para que nadie lo falsifique.
6. **¿Por qué `contrasena` tiene `select: false` y se guarda con bcrypt?** Nunca se guarda ni se devuelve la clave real; el hash no se puede invertir.
7. **¿Qué pasa si envían `{"numCelular": {"$ne": ""}}` al login?** Es inyección NoSQL; `esTexto` lo rechaza con 400 antes de llegar a la base.
8. **¿Qué garantiza que no haya inscripciones duplicadas?** Doble defensa: una consulta previa (mensaje claro) y un índice único `(id_actividad, id_estudiante)` en MongoDB (protege aunque dos peticiones lleguen a la vez).
9. **¿Qué limitación tiene el control de cupo?** Contar y luego insertar no es atómico; con peticiones simultáneas podría excederse por una. Solución: contador atómico con `$inc` condicionado.
10. **¿Por qué `asyncHandler`?** Express 4 no captura errores de funciones `async`; el envoltorio los manda al `errorHandler`.
11. **¿Por qué las fechas son texto?** Formato ISO ordenable, sin sorpresas de zona horaria; la existencia real de la fecha se valida en el modelo.
12. **¿Qué es un middleware?** Función que se ejecuta entre la petición y el controlador (`autenticar`, `soloDirector`, `validarIdParam`).

## 3. Demostraciones que debes poder hacer en vivo
- Crear una actividad como director → editarla con PUT → eliminarla.
- Provocar un 400 (quitar un campo obligatorio) y leer el arreglo `detalles`.
- Provocar un 404 (id válido que no existe) y un 400 (id `abc`).
- Provocar el rechazo por congruencia (estudiante Semillero → actividad de Banda) y mostrar el mensaje.
- Llenar el cupo y mostrar el rechazo; marcar asistencia y consultar el resumen.
- Mostrar en MongoDB Compass las tres colecciones y la referencia `id_actividad` / `id_estudiante`.

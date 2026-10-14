# Ajustes respecto a los documentos de la Etapa 2

La implementación sigue el diseño entregado, con estas diferencias. Conviene actualizar los documentos para que **problema, modelo, API y app sean coherentes** (criterio 2 de la rúbrica).

| # | Qué pasaba | Qué hace el backend | Qué actualizar en el documento |
|---|---|---|---|
| 1 | El contrato no incluía `DELETE /api/actividades/{id}` y la guía exige **CRUD completo** sobre la entidad principal | Se agregó (204; borra también sus inscripciones) | Contrato API: sumar el endpoint |
| 2 | La propuesta describe `Inscripcion` con `nombre_estudiante`, `categoria_estudiante`, `instrumento_estudiante`; el modelo de datos y el contrato usan `id_estudiante` | Se implementó el modelo **normalizado** (`id_estudiante` → `usuarios`); categoría e instrumento se leen del usuario | HU-04 CA-01 y la propuesta: el cuerpo del POST lleva `id_actividad` e `id_estudiante` |
| 3 | El ejemplo de `POST /api/actividades` no trae `descripcion`, pero HU-01 CA-01 la exige | `descripcion` es **obligatoria** (sin ella → 400) | Agregar `descripcion` al JSON de ejemplo (o decidir que sea opcional) |
| 4 | HU-02 habla de "estudiante autenticado" pero no hay endpoints de sesión | Se agregaron `POST /api/auth/registro` y `POST /api/auth/login` (JWT) | Contrato API y modelo (`Usuario` ya está en el diagrama) |
| 5 | HU-05 y HU-06 necesitan listar inscritos / inscripciones propias | Se agregó `GET /api/inscripciones?id_actividad=&id_estudiante=` | Contrato API |
| 6 | HU-06 CA-03 pide "resumen de asistencia en tiempo real" | Se agregó `GET /api/actividades/{id}/resumen` | Contrato API |
| 7 | Los mockups muestran "18 de 45 inscritos" y el estado "Justificado" | `cupo_maximo` opcional con regla de cupo; `inscritos` en la respuesta; estados `Pendiente / Asistió / Faltó / Justificado` | Modelo de datos y reglas de negocio |
| 8 | La app necesita llenar desplegables (categorías, instrumentos) | `GET /api/catalogos` | Contrato API |
| 9 | HU-06 CA-04 es una copia de HU-04 ("se creará el registro de Inscripcion") | — | Corregir el criterio: "el estado queda actualizado y la interfaz lo confirma" |

Códigos para la regla de congruencia: se eligió **409 Conflict** (el contrato permitía 400 o 409): los datos están bien formados, pero entran en conflicto con las reglas de la actividad.

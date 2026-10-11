# Guía de Rutinas y Prescripción — RU Coach

## Índice
- [Constructor Visual de Rutinas (`/admin/routines/builder`)](#constructor-visual-de-rutinas-adminroutinesbuilder)
- [Biseries y Superseries (Grupos A–E)](#biseries-y-superseries-grupos-ae)
- [Asignar Rutinas a Asesorados](#asignar-rutinas-a-asesorados)
- [Flexibilidad en Piso: Cambio de Ejercicio y Cambio de Día](#flexibilidad-en-piso-cambio-de-ejercicio-y-cambio-de-día)
- [Estructuras Recomendadas](#estructuras-recomendadas)

---

## Constructor Visual de Rutinas (`/admin/routines/builder`)

### Paso a Paso para Crear o Editar una Rutina

1. Entra a **Panel del Coach → Rutinas** (`/admin/routines`) y haz clic en **"+ Nueva rutina"** (o **"Editar"** dentro de una rutina existente).
2. Define los metadatos principales del programa:
   - **Nombre de la rutina**: ej. *"Hipertrofia 12 Semanas — Upper/Lower"*
   - **Objetivo (`goal`)**: *Ganancia muscular*, *Pérdida de grasa*, *Fuerza / Tonificación*, *Resistencia* o *Mantenimiento*
   - **Nivel (`level`)**: *Principiante*, *Intermedio* o *Avanzado*
   - **Duración (`duration_weeks`)**: Número de semanas del bloque (ej. `8` o `12`)
   - **Descripción**: Indicaciones generales del bloque para el asesorado
3. **Configura cada Día de la Semana**:
   - Puedes alternar cada día entre **Día de Entrenamiento** o **Día de Descanso Activo / Total** (`is_rest_day`).
   - Asigna un nombre claro al día (ej. *"Día 1 — Push (Pecho, Hombro, Tríceps)"*).
4. **Agrega y Ordena Ejercicios**:
   - Abre el selector conectado al catálogo de **1,324 ejercicios en español** (filtrable por grupo muscular o equipo).
   - Reordena los ejercicios arrastrándolos desde el ícono lateral (`@dnd-kit`, compatible en desktop y pantallas táctiles móviles).
   - Para cada ejercicio configura:
     - **Series (`sets`)**: ej. `4`
     - **Repeticiones (`reps`)**: ej. `8-10` (o segundos si es un ejercicio isométrico/`timed`)
     - **Peso base sugerido (`base_weight`)**: ej. `60` kg
     - **Descanso (`rest_seconds`)**: ej. `90` segundos
     - **Grupo de Biserie / Superserie (`superset_group`)**: `A`, `B`, `C`, `D`, `E` o sin agrupar
     - **Notas técnicas (`notes`)**: Indicaciones de tempo, agarre o rango de movimiento
5. Haz clic en **"Guardar Rutina"**. El servidor persiste los días y ejercicios en lote (`app/actions/routine-builder.ts`).

---

## Biseries y Superseries (Grupos A–E)

El constructor soporta agrupación visual y funcional de ejercicios mediante la columna `superset_group` (`A` a `E`):
- Si asignas la misma letra (por ejemplo, **Grupo A**) a dos o más ejercicios del mismo día, tanto en `/client/routines` como durante la sesión activa en `/client/workout/start` aparecerán identificados con su insignia de color (**Biserie / Superserie A**).
- Esto indica al asesorado que debe alternar las series entre ambos ejercicios antes de tomar el descanso largo.

---

## Asignar Rutinas a Asesorados

Puedes asignar una rutina desde:
- **El directorio de rutinas (`/admin/routines`)** haciendo clic en **"Asignar"** sobre la tarjeta de la rutina.
- **El perfil del asesorado (`/admin/clients/[clientId]`)** haciendo clic en **"Cambiar rutina"** (`/admin/clients/[clientId]/assign-routine`).

Al asignar una rutina (`assignRoutineToClient` en [`app/actions/routine-assignment.ts`](file:///home/herwingx/Development/gym-coaching/app/actions/routine-assignment.ts)):
1. Cualquier rutina activa previa del cliente en `client_routines` pasa automáticamente a estado `completed`.
2. Se crea el nuevo registro activo en `client_routines` y se sincroniza `clients.assigned_routine_id`.
3. Se envía automáticamente al asesorado:
   - Un **correo transaccional** (`NewRoutineEmail.tsx`) vía Resend.
   - Una **notificación Web Push** inmediata a su teléfono (`lib/push.ts`).

---

## Flexibilidad en Piso: Cambio de Ejercicio y Cambio de Día

Para que el asesorado nunca pierda su entrenamiento por imprevistos en el gimnasio, **RU Coach** incluye dos herramientas controladas con trazabilidad completa para el coach:

### 1. Intercambio de Ejercicio (`ExerciseSwapDrawer` / `client_exercise_overrides`)
- Desde `/client/routines` o en pleno entrenamiento (`/client/workout/start`), el asesorado puede tocar el botón de **Intercambiar ejercicio**.
- El sistema sugiere ejercicios equivalentes del mismo grupo muscular primario (`getSwapSuggestions`).
- El asesorado elige el ejercicio sustituto y el motivo (*Equipo ocupado*, *Molestia/lesión*, *No disponible en mi gym* o *Preferencia*).
- **Impacto**:
  - Se guarda en `public.client_exercise_overrides` sin alterar la plantilla original de otros clientes.
  - Las series y récords personales se registran bajo el `exercise_id` del ejercicio sustituto para no contaminar la estadística del ejercicio original.
  - El coach recibe una **notificación Push** inmediata y visualiza todas las sustituciones activas en la pestaña **Rutina** de `/admin/clients/[clientId]`, con un botón **"Restaurar original"** (`revertExerciseOverride`) para volver al ejercicio base cuando lo considere oportuno.

### 2. Cambio del Día a Entrenar Hoy (`ScheduleOverrideDialog` / `override_next_day_id`)
- Si al asesorado le tocaba *"Día 1 — Pierna"* pero necesita hacer *"Día 2 — Torso"* hoy, puede cambiar el día activo desde `/client/routines`.
- Esto actualiza `client_routines.override_next_day_id`.
- Una vez que el asesorado completa la sesión en `/client/workout/start`, `completeWorkoutSession` limpia automáticamente `override_next_day_id = null` para que el ciclo normal de días continúe en la siguiente sesión.

---

## Estructuras Recomendadas

### Full Body (3 días / semana — Principiantes)
- **Día 1**: Cuerpo Completo A (énfasis sentadilla y empuje horizontal)
- **Día 2**: Descanso
- **Día 3**: Cuerpo Completo B (énfasis bisagra de cadera y tracción vertical)
- **Día 4**: Descanso
- **Día 5**: Cuerpo Completo C (énfasis unilateral e hipertrofia accesoria)

### Upper / Lower (4 días / semana — Intermedios)
- **Día 1**: Torso Fuerza (Press Banca, Remo con Barra, Press Militar, Dominadas)
- **Día 2**: Pierna Fuerza (Sentadilla, Peso Muerto Rumano, Prensa, Pantorrilla)
- **Día 3**: Descanso
- **Día 4**: Torso Hipertrofia (Press Inclinado Mancuernas, Jalón, Elevaciones Laterales, Brazos en Biserie A)
- **Día 5**: Pierna Hipertrofia (Hack Squat, Hip Thrust, Extensión de Cuádriceps + Curl Femoral en Biserie A)

### Push / Pull / Legs (6 días / semana — Avanzados)
- **Día 1**: Push (Pecho, Hombros, Tríceps)
- **Día 2**: Pull (Espalda, Trapecio, Bíceps)
- **Día 3**: Legs (Cuádriceps, Isquiosurales, Glúteo, Pantorrilla)
- **Día 4**: Descanso
- **Día 5**: Push Variación
- **Día 6**: Pull Variación
- **Día 7**: Legs Variación

---

[Volver a Documentación Principal](./README.md)

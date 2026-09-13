# 📦 Control de Estados - Manual de Uso
Este manual explica paso a paso cómo utilizar el **Panel de Configuración** (el ícono del engranaje en la esquina superior derecha) para administrar los Cuadros Visuales y la Base de Guías del sistema.
> **Nota:** Todos los cambios realizados en el Panel de Configuración se guardan localmente en el navegador de la computadora donde se utilice. No se requiere conexión a una base de datos externa para que la configuración persista.
---
## 1. 🖼️ Pestaña "Cuadros Visuales"
En esta sección puedes definir qué campos de información adicional deseas que el sistema te solicite dinámicamente cuando cargues una guía que está "Aceptada".
### ¿Cómo crear un Cuadro Nuevo?
1. Haz clic en el botón verde **"+ Nuevo Cuadro"**.
2. **Título del Cuadro:** Escribe el nombre visible (Ej. `ZONA DESTINO`).
3. **Campo Asociado:** Es el identificador interno, escríbelo en minúsculas y sin espacios (Ej. `zonaDestino`).
4. **Tipo de Campo:** Selecciona cómo quieres ingresar este dato al crear guías:
   - **Texto Libre:** Para escribir notas a mano o texto alfanumérico.
   - **Fecha (Calendario):** Desplegará un almanaque interactivo.
   - **Seleccionable (Lista):** Obligará al usuario a elegir una opción predefinida. Si eliges esta opción, escribe las alternativas separadas por comas en el renglón inferior (Ej. `CABA, GBA SUR, INTERIOR`).
5. **Destacado:** Marca la casilla si quieres que el cuadro ocupe todo el ancho de la pantalla principal cuando aparezca un éxito.
6. Presiona **Guardar**.
---
## 2. 🗃️ Pestaña "Base de Guías"
Aquí es donde le indicas al sistema qué guías existen, qué estado real tienen, y si deben ser consideradas como un Éxito (Aceptadas) o como un Error (Rechazadas).
### ¿Cómo cargar una Guía Nueva?
1. Haz clic en el botón verde **"+ Nueva Guía"**.
2. **Nro de Guía:** Ingresa el código de barras o número de tracking.
3. **Estado Corto:** Ingresa la sigla del estado (Ej. `EPR`, `ENT`).
4. **Estado Nombre (Largo):** Ingresa el nombre completo (Ej. `EN PREPARACION`).
5. **Clasificación:** Define qué comportamiento debe tener el sistema al leerla:
   - 🟢 **Aceptada (Verde):** Al seleccionar esto, el sistema te mostrará automáticamente las opciones dinámicas basándose en los Cuadros Visuales que configuraste en la primera pestaña (te pedirá que selecciones la Zona, elijas la Fecha, etc).
   - 🔴 **Rechazada (Roja):** La guía tiene una inconsistencia y no requerirá información extra, solo arrojará la pantalla roja de error y el sonido correspondiente.
6. Completa los datos requeridos y presiona **Guardar**.
> **Consejo:** Puedes editar o eliminar cualquier guía ya creada usando los botones **Editar (Azul)** y **Eliminar (Rojo)** de la tabla en esta misma pestaña.
---
## 3. ⚙️ Pestaña "Preferencias"
Controles generales del sistema de escaneo diario:
- 🔊 **Sonidos:** Puedes activar o silenciar las alertas auditivas generales del sistema (el tono agudo de éxito y el tono grave de error al escanear).
- 🔄 **Limpiar Historial y Contadores:** Utiliza el botón rojo para restablecer los números de progreso a cero (0) y vaciar la tabla del *Historial de Escaneos*. Es el procedimiento recomendado al comenzar un nuevo turno o jornada de trabajo.

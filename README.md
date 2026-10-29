# Velocity: Momentum Rush — Actividad 03

**Prototipo digital de plataformas 2D** basado en la Actividad 02 de Diseño de Videojuegos. Una sola experiencia con **tres secciones conectadas** (introducción, desarrollo + variación, conclusión). Hecho con **HTML5 Canvas, CSS y JavaScript nativo**; **no usa** Phaser, Three.js, KAPLAY ni dependencias externas.

## Enfoque principal: DISEÑO DE NIVELES (Actividad 03)

La evaluación prioriza **cómo el escenario enseña a jugar** y la transición del prototipo físico a su versión digital. La estructura de aprendizaje es: **introducción segura → desarrollo con riesgo → variación con elección de ruta → conclusión que combina habilidades**.

- **Introducción:** una pared gris obliga a descubrir el salto cargado sin castigo.
- **Desarrollo:** un foso de pinchos requiere aplicar ese salto y un muelle agrega una interacción nueva.
- **Variación:** rampa + anillos opcionales arriba / enemigo abajo = elección de riesgo y recompensa.
- **Conclusión:** rampa, muelle y bandera exigen combinar las habilidades previamente enseñadas.


## Ejecutar

1. Descarga o descomprime todos los archivos del proyecto juntos.
2. Abre `index.html` en Chrome o Edge. También puedes publicarlo sin configuración adicional en GitHub Pages.
3. Selecciona **Comenzar** en la pantalla de título.

## Controles

| Tecla | Acción |
|---|---|
| `←` / `→` | Elegir hacia qué lado saltar; el personaje **no camina libremente** |
| `ESPACIO` | Salto normal (aproximadamente dos cuadros de distancia) |
| Mantener `C` ≥ 0,32 s, luego soltar | Salto cargado, más largo y alto |
| `R` | Reiniciar el recorrido de inmediato |
| `H` | Activar o desactivar guías **puramente visuales**, sin texto |

El muelle rojo impulsa al jugador de manera automática al aterrizar sobre él. Los anillos son recompensas opcionales. Los pinchos, las caídas y el enemigo provocan un reinicio rápido.

## Mapa separado de la lógica

El nivel está definido como **texto ASCII** en `level-map.js`, independiente del motor (`game.js`). Cada fila es una hilera de la cuadrícula y cada símbolo ocupa 40 × 40 px.

| Símbolo | Significado |
|---|---|
| `.` | Celda vacía |
| `#` | Terreno sólido |
| `W` | Muro seguro para la enseñanza inicial |
| `^` | Pinchos peligrosos |
| `S` | Muelle rojo |
| `O` | Anillo opcional |
| `E` | Enemigo patrulla |
| `/` | Segmento de rampa ascendente |
| `=` | Plataforma elevada |
| `F` | Meta / bandera |
| `P` | Posición inicial |

## Física agrupada al inicio

En la parte superior de `game.js` encontrarás el objeto `PHYSICS`:

```js
const PHYSICS = Object.freeze({
  GRAVITY: 1700,
  NORMAL_JUMP_HEIGHT: 82,
  NORMAL_JUMP_DISTANCE: 80,
  CHARGED_JUMP_HEIGHT: 215,
  CHARGED_JUMP_DISTANCE: 280,
  SPRING_JUMP_HEIGHT: 270,
  SPRING_JUMP_DISTANCE: 420,
  CHARGE_MILLISECONDS: 320,
  COYOTE_SECONDS: 0.10,
  INPUT_BUFFER_SECONDS: 0.13,
  ENEMY_SPEED: 58
});
```

## Requisitos evaluables

- Tres secciones conectadas en un único nivel de desplazamiento lateral, con una cámara que sigue la acción.
- Introducción segura, dificultad progresiva, variación, recompensa opcional y final que integra mecánicas.
- Dos peligros diferentes: pinchos y enemigo móvil; también hay huecos y caídas.
- Mecánica conservada del prototipo: salto normal, **Charged Dash Jump** y muelle.
- Reinicio inmediato, sonido generado con Web Audio y pistas visuales no verbales.
- Física ajustable y mapa modificable como texto, ambos separados.
- Prueba automatizada técnica: llegada a meta en unos 20 segundos. **Este test automático NO reemplaza un playtest humano.**

## Entregables que están en el paquete completo

- `evidencias/04_vista_general.png`: vista panorámica del nivel completo.
- `evidencias/01_seccion.png`, `02_seccion.png`, `03_seccion.png`: detalles de cada sección.
- `evidencias/06_demo_sin_narracion.mp4`: demostración técnica silenciosa **para que grabes tu explicación** (duración aprox. 24 s).
- `docs/Activity03_Design_Rationale_DRAFT.docx` y `.pdf`: borrador de 3 páginas; completar el playtest humano y los enlaces.
- `docs/GUIA_PUBLICACION.md`: pasos concretos para GitHub Pages.
- `docs/PLAYTEST_HUMANO_PENDIENTE.txt`: guía de observación.
- `docs/GUION_VIDEO.txt`: guion opcional para una grabación de menos de dos minutos.

## Autoría y uso de IA

Concepto, estructura física original y decisiones principales de diseño: proyecto de estudiante de la Actividad 02. Implementación del código, documentación y asistencia en revisión técnica: apoyo de ChatGPT. 
## Fecha de entrega

**30 de octubre de 2026.**

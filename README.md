# Velocity: Momentum Rush

**Velocity: Momentum Rush** is a browser-based 2D platform game adapted from a three-screen physical prototype. The player advances primarily by jumping, rather than walking freely, and learns how to use movement mechanics through the level's layout, colors, hazards, and rewards.

The game was built with **HTML5 Canvas, CSS, and vanilla JavaScript**. It does not require Phaser, Three.js, KAPLAY, or any external libraries.

## Objective

Reach the **green flag** at the end of the level. Use normal jumps, charged jumps, and springs to cross obstacles. Collecting golden rings is optional.

Touching spikes or an enemy, or falling into a gap, restarts the run quickly.

## Gameplay Mechanics

- **Normal jump:** A short jump covering approximately two grid squares.
- **Charged Dash Jump:** Hold the charge key, then release it to jump higher and farther.
- **Spring:** A red spring launches the character automatically when landed on.
- **Hazards:** Spikes, gaps, and a moving enemy punish poorly timed jumps.
- **Optional rings:** Rewards placed to encourage exploration and risk-taking; they are not required to finish.
- **Visual cues:** Shapes, contrasting colors, and optional nonverbal guides help players discover where to jump.

## Level Design

The game consists of **one continuous level divided into three connected sections**:

1. **Introduction — Learn safely:** A gray wall introduces the charged jump without an immediate hazard. Players can experiment with jump distance.
2. **Development and twist — Apply and explore:** A spike pit tests the charged jump, a spring introduces another movement interaction, and a ramp creates a choice between an upper route with optional rings and a lower route with an enemy.
3. **Conclusion — Combine skills:** A ramp, spring, and final hazards challenge players to apply the mechanics they have already learned to reach the flag.

The level is designed to teach primarily **through gameplay instead of written instructions**.

## Controls

| Key | Action |
|---|---|
| `←` / `→` | Select the direction of the next jump (the character does **not** walk freely). |
| `Space` | Normal jump. |
| Hold `C` for at least **0.32 seconds**, then release | Charged Dash Jump. |
| `R` | Restart the run. |
| `H` | Show or hide nonverbal visual guides. |

The title screen displays the main controls in English. Select **Start** to begin.

## How to Run

1. Download or clone this repository.
2. Keep `index.html`, `game.js`, `level-map.js`, and `style.css` in the same folder.
3. Open **`index.html`** using a desktop browser such as Chrome or Edge.
4. Select **Start** on the title screen.

No installation, build process, or external dependencies are required. The project can also be hosted on GitHub Pages.

## Project Files

| File | Purpose |
|---|---|
| `index.html` | Game page, canvas, and title/end interface. |
| `style.css` | Page layout and visual styling. |
| `game.js` | Movement, physics, collisions, camera, sounds, and game logic. |
| `level-map.js` | **Editable text map** containing the level layout. |
| `README.md` | This guide. |

## How to Edit the Level Map

Open **`level-map.js`** in a text editor. The level is stored as an **ASCII map**: each character represents one **40 × 40 pixel** grid cell.

| Symbol | Element |
|---|---|
| `.` | Empty space |
| `#` | Solid ground |
| `W` | Safe introductory wall |
| `^` | Spikes |
| `S` | Red spring |
| `O` | Optional ring |
| `E` | Patrolling enemy |
| `/` | Upward ramp segment |
| `=` | Elevated platform |
| `F` | Finish flag |
| `P` | Starting position |

For example, replace an empty cell (`.`) with `O` to add a ring, then save the file and refresh the browser. **Keep every row the same length** so the map remains rectangular. The existing map represents three connected sections of 28 columns each.

## How to Adjust Game Physics

The `PHYSICS` object is located near the beginning of **`game.js`**. You can edit its values to change how movement feels:

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

For example, increase `NORMAL_JUMP_HEIGHT` to make the normal jump higher, or change `ENEMY_SPEED` to adjust the enemy's movement. Save `game.js` and refresh the page to apply your changes.

## Technologies

- **HTML5 Canvas:** Draws the game world and character.
- **CSS:** Styles the page and menus.
- **JavaScript:** Controls movement, collision detection, camera, and game state.
- **Web Audio API:** Generates short gameplay sound effects.

## Project Credits

The original physical prototype, gameplay concept, and main level-design decisions were developed as part of a Video Game Design course project. ChatGPT assisted with the digital code implementation, documentation, and technical review.

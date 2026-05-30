const TILE_SIZE = 20
const COLS = 28
const ROWS = 31
const WIDTH = COLS * TILE_SIZE
const HEIGHT = ROWS * TILE_SIZE

const T = {
  WALL: 0,
  PELLET: 1,
  POWER: 2,
  EMPTY: 3,
  HOUSE: 4,
  GATE: 5,
}

const DIR = {
  UP: 0,
  DOWN: 1,
  LEFT: 2,
  RIGHT: 3,
  NONE: 4,
}

const DX = { 0: 0, 1: 0, 2: -1, 3: 1, 4: 0 }
const DY = { 0: -1, 1: 1, 2: 0, 3: 0, 4: 0 }

const PAC_SPEED = 160
const GHOST_SPEED = 140
const FRIGHT_SPEED = 90
const EATEN_SPEED = 300

const MODE_DURATION = [7, 20, 7, 20, 5, 20, 5, -1]
const FRIGHT_DURATION = [8, 6, 4, 2]

const SCORE = {
  PELLET: 10,
  POWER: 50,
  GHOST: [200, 400, 800, 1600],
}

const COLORS = {
  bg: '#000',
  wall: '#5577ff',
  pellet: '#ffb8ae',
  power: '#ffb8ae',
  gate: '#ffb8ff',
  pacman: '#ffff00',
  ghost: ['#ff0000', '#ffb8ff', '#00ffff', '#ffb852'],
  fright: '#2121ff',
  eyes: '#fff',
  text: '#fff',
}

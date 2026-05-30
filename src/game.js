/// <reference path="./constants.js" />
/// <reference path="./map.js" />
/// <reference path="./audio.js" />

function tileCenter(tile) {
  return tile * TILE_SIZE + TILE_SIZE / 2
}

function posToTile(px) {
  return Math.floor(px / TILE_SIZE)
}

function nearestTileCenter(px) {
  return Math.round((px - TILE_SIZE / 2) / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2
}

function atTileCenter(entity) {
  const cx = nearestTileCenter(entity.x)
  const cy = nearestTileCenter(entity.y)
  return Math.abs(entity.x - cx) < 1 && Math.abs(entity.y - cy) < 1
}

function snapToTile(entity) {
  entity.x = nearestTileCenter(entity.x)
  entity.y = nearestTileCenter(entity.y)
  entity.tileX = posToTile(entity.x)
  entity.tileY = posToTile(entity.y)
}

function wrapTile(x, cols) {
  if (x < 0) return cols - 1
  if (x >= cols) return 0
  return x
}

function createPacman() {
  return {
    x: tileCenter(14),
    y: tileCenter(23),
    tileX: 14,
    tileY: 23,
    dir: DIR.LEFT,
    nextDir: DIR.NONE,
    speed: PAC_SPEED,
    mouth: 0,
    mouthOpen: true,
    moving: false,
  }
}

function createGhosts(level) {
  const spawns = [
    { name: 'blinky', colorIdx: 0, x: 14, y: 11, scatter: { x: 27, y: 0 }, releaseDelay: 0 },
    { name: 'pinky', colorIdx: 1, x: 14, y: 14, scatter: { x: 0, y: 0 }, releaseDelay: 2 },
    { name: 'inky', colorIdx: 2, x: 12, y: 14, scatter: { x: 27, y: 30 }, releaseDelay: 6 },
    { name: 'clyde', colorIdx: 3, x: 16, y: 14, scatter: { x: 0, y: 30 }, releaseDelay: 10 },
  ]

  return spawns.map((s) => ({
    ...s,
    x: tileCenter(s.x),
    y: tileCenter(s.y),
    tileX: s.x,
    tileY: s.y,
    dir: DIR.UP,
    speed: GHOST_SPEED + (level - 1) * 4,
    state: s.name === 'blinky' ? 'chase' : 'house',
    inHouse: s.name !== 'blinky',
    releaseTimer: s.releaseDelay,
    frightened: false,
    eaten: false,
    frightTimer: 0,
    targetX: 0,
    targetY: 0,
  }))
}

function initGame(level = 1) {
  const { map, pellets } = createMap()
  return {
    map,
    pelletsRemaining: pellets,
    pacman: createPacman(),
    ghosts: createGhosts(level),
    score: 0,
    lives: 3,
    level,
    state: 'ready',
    mode: 'scatter',
    modeIdx: 0,
    modeTimer: 0,
    frightTimer: 0,
    frightGhosts: 0,
    ghostCombo: 0,
    dyingTimer: 0,
    readyTimer: 2,
  }
}

function getTargetForGhost(ghost, pacman, ghosts) {
  if (ghost.eaten) {
    return { x: 14, y: 11 }
  }

  if (ghost.state === 'scatter') {
    return ghost.scatter
  }

  switch (ghost.name) {
    case 'blinky':
      return { x: pacman.tileX, y: pacman.tileY }
    case 'pinky': {
      let tx = pacman.tileX + DX[pacman.dir] * 4
      let ty = pacman.tileY + DY[pacman.dir] * 4
      if (pacman.dir === DIR.UP) { tx -= 4; ty -= 4 }
      return { x: wrapTile(tx, COLS), y: ty }
    }
    case 'inky': {
      const ahead = 2
      let ax = pacman.tileX + DX[pacman.dir] * ahead
      let ay = pacman.tileY + DY[pacman.dir] * ahead
      if (pacman.dir === DIR.UP) { ax -= 2; ay -= 2 }
      const blinky = ghosts.find((g) => g.name === 'blinky')
      const dx = ax - blinky.tileX
      const dy = ay - blinky.tileY
      return { x: wrapTile(blinky.tileX + dx * 2, COLS), y: blinky.tileY + dy * 2 }
    }
    case 'clyde': {
      const dist = Math.abs(ghost.tileX - pacman.tileX) + Math.abs(ghost.tileY - pacman.tileY)
      if (dist > 8) return { x: pacman.tileX, y: pacman.tileY }
      return ghost.scatter
    }
    default:
      return { x: pacman.tileX, y: pacman.tileY }
  }
}

function dist(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2)
}

function chooseGhostDir(ghost, map, target) {
  const opposites = { 0: 1, 1: 0, 2: 3, 3: 2 }
  const reverse = opposites[ghost.dir]
  let bestDir = ghost.dir
  let bestDist = Infinity

  const dirs = ghost.frightened
    ? [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT].sort(() => Math.random() - 0.5)
    : [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT]

  for (const d of dirs) {
    if (d === reverse) continue
    const nx = wrapTile(ghost.tileX + DX[d], COLS)
    const ny = ghost.tileY + DY[d]
    if (ny < 0 || ny >= ROWS) continue
    const tile = map[ny][nx]
    if (!isWalkable(tile) && tile !== T.GATE && tile !== T.HOUSE) continue
    if (ghost.eaten && tile === T.GATE && ny < 14) continue

    const dxy = dist(nx, ny, target.x, target.y)
    if (dxy < bestDist) {
      bestDist = dxy
      bestDir = d
    }
  }

  return bestDir
}

function moveEntity(entity, dt, map) {
  if (!entity.moving && entity.dir === DIR.NONE) return

  const speed = entity.speed || 0
  if (speed === 0) return

  const nextTileX = wrapTile(entity.tileX + DX[entity.dir], COLS)
  const nextTileY = entity.tileY + DY[entity.dir]

  let blocked = false
  if (nextTileY >= 0 && nextTileY < ROWS) {
    const tile = map[nextTileY][nextTileX]
    if (!isWalkable(tile) && tile !== T.GATE && tile !== T.HOUSE) {
      blocked = true
    }
    if (entity.isPacman && (tile === T.HOUSE || tile === T.GATE)) {
      blocked = true
    }
  }

  if (blocked) {
    snapToTile(entity)
    entity.moving = false
    return
  }

  entity.x += DX[entity.dir] * speed * dt
  entity.y += DY[entity.dir] * speed * dt

  if (entity.x < -TILE_SIZE / 2) {
    entity.x = WIDTH + TILE_SIZE / 2
  } else if (entity.x > WIDTH + TILE_SIZE / 2) {
    entity.x = -TILE_SIZE / 2
  }

  entity.tileX = wrapTile(posToTile(entity.x), COLS)
  entity.tileY = posToTile(entity.y)
}

function isTileWalkableForPacman(entity, tx, ty, map) {
  if (ty < 0 || ty >= ROWS) return false
  const wrappedTx = wrapTile(tx, COLS)
  const tile = map[ty][wrappedTx]
  if (!(isWalkable(tile) || tile === T.GATE || tile === T.HOUSE)) return false
  if (entity.isPacman && (tile === T.HOUSE || tile === T.GATE)) return false
  return true
}

function checkTurn(entity, map) {
  if (entity.nextDir === DIR.NONE) return
  const targetDir = entity.nextDir

  if (targetDir === entity.dir) {
    entity.nextDir = DIR.NONE
    return
  }

  if (targetDir === oppositeDir(entity.dir)) {
    const nx = wrapTile(entity.tileX + DX[targetDir], COLS)
    const ny = entity.tileY + DY[targetDir]
    if (isTileWalkableForPacman(entity, nx, ny, map)) {
      entity.dir = targetDir
      entity.nextDir = DIR.NONE
      entity.moving = true
      entity.x += DX[targetDir] * 0.1
      entity.y += DY[targetDir] * 0.1
    }
    return
  }

  if (!entity.moving) {
    const nx = wrapTile(entity.tileX + DX[targetDir], COLS)
    const ny = entity.tileY + DY[targetDir]
    if (isTileWalkableForPacman(entity, nx, ny, map)) {
      entity.dir = targetDir
      entity.nextDir = DIR.NONE
      entity.moving = true
      entity.x += DX[targetDir] * 0.1
      entity.y += DY[targetDir] * 0.1
    }
    return
  }

  const isVertical = targetDir === DIR.UP || targetDir === DIR.DOWN
  const curDir = entity.dir
  const dirSign = (curDir === DIR.RIGHT || curDir === DIR.DOWN) ? 1 : -1
  const behindTolerance = TILE_SIZE / 2

  let tileX = entity.tileX
  let tileY = entity.tileY

  for (let i = 0; i < COLS; i++) {
    const targetTX = tileX + DX[targetDir]
    const targetTY = tileY + DY[targetDir]

    if (isTileWalkableForPacman(entity, targetTX, targetTY, map)) {
      const cx = tileCenter(tileX)
      const cy = tileCenter(tileY)

      let behind = false
      if (isVertical) {
        if (dirSign > 0) behind = cx + behindTolerance < entity.x
        else behind = cx - behindTolerance > entity.x
      } else {
        if (dirSign > 0) behind = cy + behindTolerance < entity.y
        else behind = cy - behindTolerance > entity.y
      }

      if (!behind) {
        let aligned = false
        if (isVertical) {
          if (dirSign > 0) aligned = entity.x + 1 >= cx
          else aligned = entity.x - 1 <= cx
        } else {
          if (dirSign > 0) aligned = entity.y + 1 >= cy
          else aligned = entity.y - 1 <= cy
        }

        if (aligned) {
          if (isVertical) entity.x = cx
          else entity.y = cy
          entity.tileX = tileX
          entity.tileY = tileY
          entity.dir = targetDir
          entity.nextDir = DIR.NONE
          entity.moving = true
          entity.x += DX[targetDir] * 0.1
          entity.y += DY[targetDir] * 0.1
        }
        return
      }
    }

    const nextTX = wrapTile(tileX + DX[curDir], COLS)
    const nextTY = tileY + DY[curDir]
    if (!isTileWalkableForPacman(entity, nextTX, nextTY, map)) break
    tileX = nextTX
    tileY = nextTY
  }
}

function handlePacmanPellet(game) {
  const p = game.pacman
  const { map } = game
  const tile = map[p.tileY]?.[p.tileX]

  if (tile === T.PELLET) {
    map[p.tileY][p.tileX] = T.EMPTY
    game.pelletsRemaining--
    game.score += SCORE.PELLET
    p.mouth = 0.05
    p.mouthOpen = true
    playChomp()
  } else if (tile === T.POWER) {
    map[p.tileY][p.tileX] = T.EMPTY
    game.pelletsRemaining--
    game.score += SCORE.POWER
    game.frightTimer = FRIGHT_DURATION[Math.min(game.level - 1, FRIGHT_DURATION.length - 1)]
    game.ghostCombo = 0
    p.mouth = 0.05
    p.mouthOpen = true
    playChomp()
    playPowerUp()
    startFrightSound()
    for (const ghost of game.ghosts) {
      if (ghost.state === 'chase' || ghost.state === 'scatter') {
        ghost.frightened = true
        ghost.frightTimer = game.frightTimer
        ghost.speed = FRIGHT_SPEED
        ghost.dir = oppositeDir(ghost.dir)
      }
    }
  }
}

function oppositeDir(d) {
  return { 0: 1, 1: 0, 2: 3, 3: 2 }[d] ?? DIR.NONE
}

function checkGhostCollision(game) {
  const p = game.pacman
  for (const ghost of game.ghosts) {
    if (ghost.state === 'house' || ghost.eaten) continue
    if (ghost.tileX === p.tileX && ghost.tileY === p.tileY) {
      if (ghost.frightened) {
        ghost.frightened = false
        ghost.eaten = true
        ghost.state = 'eaten'
        ghost.speed = EATEN_SPEED
        const idx = Math.min(game.ghostCombo, 3)
        game.score += SCORE.GHOST[idx]
        game.ghostCombo++
      } else {
        stopFrightSound()
        playDeath()
        return ghost
      }
    }
  }
  return null
}

function releaseGhosts(game, dt) {
  for (const ghost of game.ghosts) {
    if (ghost.state !== 'house') continue
    ghost.releaseTimer -= dt
    if (ghost.releaseTimer <= 0) {
      ghost.state = 'chase'
      ghost.inHouse = false
      ghost.x = tileCenter(14)
      ghost.y = tileCenter(11)
      ghost.dir = DIR.LEFT
      snapToTile(ghost)
    }
  }
}

function handleEatenGhosts(game, dt) {
  for (const ghost of game.ghosts) {
    if (!ghost.eaten) continue
    if (ghost.tileX === 14 && ghost.tileY === 11) {
      ghost.eaten = false
      ghost.frightened = false
      ghost.state = 'chase'
      ghost.speed = GHOST_SPEED + (game.level - 1) * 4
      ghost.dir = DIR.UP
      ghost.x = tileCenter(14)
      ghost.y = tileCenter(14)
      snapToTile(ghost)
    }
  }
}

function updateMode(game, dt) {
  if (game.pelletsRemaining === 0) {
    game.state = 'levelComplete'
    return
  }

  if (game.frightTimer > 0) {
    game.frightTimer -= dt
    if (game.frightTimer <= 0) {
      game.frightTimer = 0
      stopFrightSound()
      for (const ghost of game.ghosts) {
        ghost.frightened = false
        if (!ghost.eaten) ghost.speed = GHOST_SPEED + (game.level - 1) * 4
      }
    }
  }

  if (game.frightTimer <= 0) {
    game.modeTimer += dt
    const duration = MODE_DURATION[game.modeIdx]
    if (duration > 0 && game.modeTimer >= duration) {
      game.modeTimer = 0
      game.modeIdx = (game.modeIdx + 1) % MODE_DURATION.length
      game.mode = game.modeIdx % 2 === 0 ? 'scatter' : 'chase'
      for (const ghost of game.ghosts) {
        if (!ghost.frightened && !ghost.eaten && ghost.state !== 'house') {
          ghost.dir = oppositeDir(ghost.dir)
          ghost.state = game.mode
        }
      }
    }
  }
}

function ghostAI(game, dt) {
  for (const ghost of game.ghosts) {
    if (ghost.state === 'house') continue

    if (ghost.frightened) {
      ghost.frightTimer -= dt
      if (ghost.frightTimer <= 0) {
        ghost.frightened = false
      }
    }

    const target = ghost.eaten
      ? { x: 14, y: 11 }
      : ghost.frightened
        ? { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }
        : getTargetForGhost(ghost, game.pacman, game.ghosts)

    ghost.targetX = target.x
    ghost.targetY = target.y

    if (atTileCenter(ghost)) {
      snapToTile(ghost)
      ghost.dir = chooseGhostDir(ghost, game.map, target)
      ghost.moving = true
    }

    moveEntity(ghost, dt, game.map)
  }
}

function drawMap(ctx, game) {
  const { map } = game

  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tile = map[r][c]
      const x = c * TILE_SIZE
      const y = r * TILE_SIZE

      if (tile === T.WALL) {
        ctx.fillStyle = COLORS.wall
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)

        const drawBorder = (checkR, checkC, thick) => {
          const tr = r + checkR
          const tc = wrapTile(c + checkC, COLS)
          if (tr < 0 || tr >= ROWS) return true
          if (tc < 0 || tc >= COLS) return true
          const neighbor = map[tr][tc]
          return neighbor !== T.WALL && neighbor !== T.HOUSE
        }

        ctx.fillStyle = COLORS.bg
        if (drawBorder(-1, 0)) ctx.fillRect(x + 1, y, TILE_SIZE - 2, 3)
        if (drawBorder(1, 0)) ctx.fillRect(x + 1, y + TILE_SIZE - 3, TILE_SIZE - 2, 3)
        if (drawBorder(0, -1)) ctx.fillRect(x, y + 1, 3, TILE_SIZE - 2)
        if (drawBorder(0, 1)) ctx.fillRect(x + TILE_SIZE - 3, y + 1, 3, TILE_SIZE - 2)

        if (drawBorder(-1, -1)) ctx.fillRect(x + 1, y + 1, 3, 3)
        if (drawBorder(-1, 1)) ctx.fillRect(x + TILE_SIZE - 4, y + 1, 3, 3)
        if (drawBorder(1, -1)) ctx.fillRect(x + 1, y + TILE_SIZE - 4, 3, 3)
        if (drawBorder(1, 1)) ctx.fillRect(x + TILE_SIZE - 4, y + TILE_SIZE - 4, 3, 3)
      } else if (tile === T.GATE) {
        ctx.fillStyle = COLORS.gate
        ctx.fillRect(x, y + TILE_SIZE / 2 - 2, TILE_SIZE, 4)
      } else if (tile === T.PELLET) {
        ctx.fillStyle = COLORS.pellet
        ctx.beginPath()
        ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 2, 0, Math.PI * 2)
        ctx.fill()
      } else if (tile === T.POWER) {
        ctx.fillStyle = COLORS.power
        const pulse = 1 + 0.2 * Math.sin(Date.now() / 200)
        ctx.beginPath()
        ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 5 * pulse, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
}

function drawPacman(ctx, p) {
  const cx = p.x
  const cy = p.y
  const r = TILE_SIZE / 2 - 2

  const dirAngles = {
    [DIR.RIGHT]: 0,
    [DIR.DOWN]: Math.PI / 2,
    [DIR.LEFT]: Math.PI,
    [DIR.UP]: -Math.PI / 2,
  }

  const baseAngle = dirAngles[p.dir] ?? 0
  const mouth = p.mouth
  const startAngle = baseAngle + mouth
  const endAngle = baseAngle + Math.PI * 2 - mouth

  ctx.fillStyle = COLORS.pacman
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.arc(cx, cy, r, startAngle, endAngle)
  ctx.closePath()
  ctx.fill()
}

function drawGhost(ctx, ghost) {
  const cx = ghost.x
  const cy = ghost.y
  const r = TILE_SIZE / 2 - 2

  if (ghost.eaten) {
    ctx.fillStyle = COLORS.eyes
    ctx.beginPath()
    ctx.arc(cx - 3, cy - 2, 2, 0, Math.PI * 2)
    ctx.arc(cx + 3, cy - 2, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = COLORS.eyes
    ctx.beginPath()
    ctx.arc(cx - 3, cy - 1, 1, 0, Math.PI * 2)
    ctx.arc(cx + 3, cy - 1, 1, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  const color = ghost.frightened
    ? (ghost.frightTimer < 2 && Math.floor(Date.now() / 200) % 2 === 0
      ? '#fff'
      : COLORS.fright)
    : COLORS.ghost[ghost.colorIdx]

  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(cx, cy, r, Math.PI, 0)
  ctx.lineTo(cx + r, cy + r)

  for (let i = 0; i < 3; i++) {
    const wx = cx + r - (i * r * 2) / 3
    ctx.quadraticCurveTo(wx - r / 3, cy + r + 4, wx - r / 3, cy + r)
  }

  ctx.closePath()
  ctx.fill()

  const eyeX = 3
  const eyeY = -2
  const eyeR = 2

  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.ellipse(cx - eyeX, cy + eyeY, eyeR + 0.5, eyeR + 1, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(cx + eyeX, cy + eyeY, eyeR + 0.5, eyeR + 1, 0, 0, Math.PI * 2)
  ctx.fill()

  const pupilOff = ghost.frightened ? 0 : DX[ghost.dir] * 1
  const pupilOffY = ghost.frightened ? 0 : DY[ghost.dir] * 1

  ctx.fillStyle = ghost.frightened ? '#ff0000' : '#0000ff'
  ctx.beginPath()
  ctx.arc(cx - eyeX + pupilOff, cy + eyeY + pupilOffY, 1, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + eyeX + pupilOff, cy + eyeY + pupilOffY, 1, 0, Math.PI * 2)
  ctx.fill()
}

function drawUI(ctx, game) {
  if (game.state === 'gameOver') {
    ctx.fillStyle = 'rgba(0,0,0,0.65)'
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

    ctx.fillStyle = '#f44'
    ctx.font = 'bold 100px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('GAME OVER', WIDTH / 2, HEIGHT / 2 - 14)

    const adv = isMobile() ? 'Tap' : 'Press SPACE'
    ctx.fillStyle = '#fff'
    ctx.font = '20px monospace'
    ctx.fillText(adv + ' to restart', WIDTH / 2, HEIGHT / 2 + 42)
    return
  }

  if (game.state === 'ready') {
    ctx.fillStyle = COLORS.text
    ctx.font = 'bold 20px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('READY!', WIDTH / 2, HEIGHT / 2 - 20)
  }

  if (game.state === 'dying' && game.deathParticles) {
    for (const p of game.deathParticles) {
      const alpha = Math.max(0, p.life)
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      const s = p.size * (0.5 + p.life * 0.5)
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s)
    }
    ctx.globalAlpha = 1
  }
}

function createDeathParticles(x, y) {
  const particles = []
  const colors = ['#ffff00', '#ffcc00', '#ff9900', '#ff6600', '#ffffff']
  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 30 + Math.random() * 80
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 1 + Math.random() * 0.8,
      size: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
    })
  }
  return particles
}

function resetPositions(game) {
  game.pacman = createPacman()
  game.ghosts = createGhosts(game.level)
}

function update(game, dt) {
  if (game.state === 'ready') {
    game.readyTimer -= dt
    if (game.readyTimer <= 0) {
      game.state = 'playing'
    }
    return
  }

  if (game.state === 'dying') {
    game.dyingTimer += dt
    if (game.deathParticles) {
      for (const p of game.deathParticles) {
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vy += 60 * dt
        p.life -= p.decay * dt
      }
    }
    if (game.dyingTimer >= 1) {
      delete game.deathParticles
      if (game.lives <= 0) {
        game.state = 'gameOver'
      } else {
        resetPositions(game)
        game.state = 'ready'
        game.readyTimer = 1.5
        game.dyingTimer = 0
      }
    }
    return
  }

  if (game.state === 'gameOver' || game.state === 'levelComplete') {
    return
  }

  updateMode(game, dt)
  releaseGhosts(game, dt)

  checkTurn(game.pacman, game.map)
  if (game.pelletsRemaining > 0) {
    game.pacman.moving = true
    moveEntity(game.pacman, dt, game.map)
  }

  if (game.pacman.moving) {
    game.pacman.mouth += dt * 8
    if (game.pacman.mouth > Math.PI / 4 || game.pacman.mouth < 0.05) {
      game.pacman.mouthOpen = !game.pacman.mouthOpen
    }
    game.pacman.mouth = game.pacman.mouthOpen
      ? Math.min(game.pacman.mouth + dt * 6, Math.PI / 4)
      : Math.max(game.pacman.mouth - dt * 6, 0.05)
  } else {
    game.pacman.mouth = 0.05
  }

  handlePacmanPellet(game)

  ghostAI(game, dt)
  handleEatenGhosts(game, dt)

  const hitGhost = checkGhostCollision(game)
  if (hitGhost) {
    game.lives--
    game.state = 'dying'
    game.dyingTimer = 0
    game.deathParticles = createDeathParticles(game.pacman.x, game.pacman.y)
  }

  if (game.pelletsRemaining === 0) {
    game.state = 'levelComplete'
  }
}

function draw(ctx, game) {
  drawMap(ctx, game)

  if (game.state !== 'dying' && game.state !== 'gameOver') {
    drawPacman(ctx, game.pacman)
    for (const ghost of game.ghosts) {
      if (ghost.state !== 'house' || ghost.releaseTimer < 1) {
        drawGhost(ctx, ghost)
      }
    }
  }

  drawUI(ctx, game)
}

function updateUI(game, mobile) {
  document.getElementById('score').textContent = game.score
  document.getElementById('lives').textContent = Math.max(0, game.lives - 1)
  document.getElementById('level').textContent = game.level

  const adv = mobile ? 'Tap' : 'Press SPACE'

  const status = document.getElementById('status')
  if (game.state === 'gameOver') {
    status.textContent = ''
  } else if (game.state === 'levelComplete') {
    status.textContent = 'LEVEL COMPLETE! — ' + adv
    status.style.color = '#ff0'
  } else {
    status.textContent = ''
  }
}

function dirNameToConst(name) {
  switch (name) {
    case 'up':    return DIR.UP
    case 'down':  return DIR.DOWN
    case 'left':  return DIR.LEFT
    case 'right': return DIR.RIGHT
    default:      return DIR.NONE
  }
}

function setupJoystick(game) {
  const area = document.getElementById('joystick-area')
  if (!area) return

  const buttons = area.querySelectorAll('[data-dir]')
  let audioUnlocked = false

  function unlockAudio() {
    if (audioUnlocked) return
    audioUnlocked = true
    const c = window.AudioContext || window.webkitAudioContext
    try {
      const a = new c()
      if (a.state === 'suspended') a.resume()
      a.close()
    } catch (_) { /* ok */ }
  }

  function handleTouchStart(dirName) {
    unlockAudio()
    if (game.state === 'gameOver') {
      stopFrightSound()
      const fresh = initGame(1)
      Object.assign(game, fresh)
      game.pacman.nextDir = dirNameToConst(dirName)
      return
    }
    if (game.state === 'levelComplete') {
      stopFrightSound()
      const fresh = initGame(game.level + 1)
      Object.assign(game, fresh)
      game.pacman.nextDir = dirNameToConst(dirName)
      return
    }
    if (game.state !== 'playing') return
    game.pacman.nextDir = dirNameToConst(dirName)
  }

  buttons.forEach((btn) => {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      handleTouchStart(btn.dataset.dir)
    })

    btn.addEventListener('pointerenter', (e) => {
      if (e.buttons > 0) {
        handleTouchStart(btn.dataset.dir)
      }
    })
  })

  area.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('[data-dir]')) {
      unlockAudio()
    }
  })
}

function isMobile() {
  return matchMedia('(max-width: 800px) and (pointer: coarse)').matches
}

function init() {
  const canvas = document.getElementById('game-canvas')
  const ctx = canvas.getContext('2d')

  let game = initGame(1)
  let lastTime = 0

  setupJoystick(game)

  canvas.addEventListener('pointerdown', () => {
    if (game.state === 'gameOver') {
      stopFrightSound()
      const fresh = initGame(1)
      Object.assign(game, fresh)
    } else if (game.state === 'levelComplete') {
      stopFrightSound()
      const fresh = initGame(game.level + 1)
      Object.assign(game, fresh)
    }
  })

  function loop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.05)
    lastTime = time

    update(game, dt)
    draw(ctx, game)
    updateUI(game, isMobile())

    requestAnimationFrame(loop)
  }

  requestAnimationFrame(loop)

  function handleKey(e) {
    if (game.state === 'gameOver' && e.code === 'Space') {
      e.preventDefault()
      stopFrightSound()
      const fresh = initGame(1)
      Object.assign(game, fresh)
      return
    }

    if (game.state === 'levelComplete' && e.code === 'Space') {
      e.preventDefault()
      stopFrightSound()
      const fresh = initGame(game.level + 1)
      Object.assign(game, fresh)
      return
    }

    if (game.state !== 'playing') return

    switch (e.code) {
      case 'ArrowUp':    game.pacman.nextDir = DIR.UP; break
      case 'ArrowDown':  game.pacman.nextDir = DIR.DOWN; break
      case 'ArrowLeft':  game.pacman.nextDir = DIR.LEFT; break
      case 'ArrowRight': game.pacman.nextDir = DIR.RIGHT; break
      default: return
    }
    e.preventDefault()
  }

  window.addEventListener('keydown', handleKey)
}

window.addEventListener('DOMContentLoaded', init)

function createMap() {
  const W = T.WALL
  const P = T.PELLET
  const O = T.POWER
  const E = T.EMPTY
  const H = T.HOUSE
  const G = T.GATE

  // 28 columns × 31 rows
  const map = [
    [W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],
    [W,P,P,P,P,P,P,P,P,P,P,P,P,W,W,P,P,P,P,P,P,P,P,P,P,P,P,W],
    [W,P,W,W,W,W,P,W,W,W,W,W,P,W,W,P,W,W,W,W,W,P,W,W,W,W,P,W],
    [W,O,W,W,W,W,P,W,W,W,W,W,P,W,W,P,W,W,W,W,W,P,W,W,W,W,O,W],
    [W,P,W,W,W,W,P,W,W,W,W,W,P,W,W,P,W,W,W,W,W,P,W,W,W,W,P,W],
    [W,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,W],
    [W,P,W,W,W,W,P,W,W,P,W,W,W,W,W,W,W,W,P,W,W,P,W,W,W,W,P,W],
    [W,P,W,W,W,W,P,W,W,P,W,W,W,W,W,W,W,W,P,W,W,P,W,W,W,W,P,W],
    [W,P,P,P,P,P,P,W,W,P,P,P,P,W,W,P,P,P,P,W,W,P,P,P,P,P,P,W],
    [W,W,W,W,W,W,P,W,W,W,W,W,E,W,W,E,W,W,W,W,W,P,W,W,W,W,W,W],
    [E,E,E,E,E,W,P,W,W,W,W,W,E,W,W,E,W,W,W,W,W,P,W,E,E,E,E,E],
    [E,E,E,E,E,W,P,W,W,E,E,E,E,E,E,E,E,E,E,W,W,P,W,E,E,E,E,E],
    [E,E,E,E,E,W,P,W,W,E,W,W,W,G,G,W,W,W,E,W,W,P,W,E,E,E,E,E],
    [W,W,W,W,W,W,P,W,W,E,W,H,H,H,H,H,H,W,E,W,W,P,W,W,W,W,W,W],
    [E,E,E,E,E,E,P,W,W,E,W,H,H,H,H,H,H,W,E,W,W,P,E,E,E,E,E,E],
    [W,W,W,W,W,W,P,W,W,E,W,H,H,H,H,H,H,W,E,W,W,P,W,W,W,W,W,W],
    [E,E,E,E,E,W,P,W,W,E,W,W,W,W,W,W,W,W,E,W,W,P,W,E,E,E,E,E],
    [E,E,E,E,E,W,P,W,W,E,E,E,E,E,E,E,E,E,E,W,W,P,W,E,E,E,E,E],
    [E,E,E,E,E,W,P,W,W,E,W,W,W,W,W,W,W,W,E,W,W,P,W,E,E,E,E,E],
    [W,W,W,W,W,W,P,W,W,E,W,W,W,W,W,W,W,W,E,W,W,P,W,W,W,W,W,W],
    [W,P,P,P,P,P,P,P,P,P,P,P,P,W,W,P,P,P,P,P,P,P,P,P,P,P,P,W],
    [W,P,W,W,W,W,P,W,W,W,W,W,P,W,W,P,W,W,W,W,W,P,W,W,W,W,P,W],
    [W,P,W,W,W,W,P,W,W,W,W,W,P,W,W,P,W,W,W,W,W,P,W,W,W,W,P,W],
    [W,O,P,P,W,W,P,P,P,P,P,P,P,E,E,P,P,P,P,P,P,P,W,W,P,P,O,W],
    [W,W,W,P,W,W,P,W,W,P,W,W,W,W,W,W,W,W,P,W,W,P,W,W,P,W,W,W],
    [W,W,W,P,W,W,P,W,W,P,W,W,W,W,W,W,W,W,P,W,W,P,W,W,P,W,W,W],
    [W,P,P,P,P,P,P,W,W,P,P,P,P,W,W,P,P,P,P,W,W,P,P,P,P,P,P,W],
    [W,P,W,W,W,W,W,W,W,W,W,W,P,W,W,P,W,W,W,W,W,W,W,W,W,W,P,W],
    [W,P,W,W,W,W,W,W,W,W,W,W,P,W,W,P,W,W,W,W,W,W,W,W,W,W,P,W],
    [W,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,W],
    [W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],
  ]

  let pellets = 0
  for (const row of map) {
    for (const tile of row) {
      if (tile === P || tile === O) pellets++
    }
  }

  return { map, pellets }
}

function isWalkable(tile) {
  return tile !== T.WALL && tile !== T.HOUSE && tile !== T.GATE
}

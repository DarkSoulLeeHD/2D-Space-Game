// services/pathfinding.ts - A*-Pfadfinder & Sichtlinien-Engine für das 10x10 Taktik-Grid

export interface IPathNode {
  x: number;
  y: number;
  g: number; // Tatsächliche Kosten vom Start
  h: number; // Heuristische Distanz zum Ziel
  f: number; // Gesamt-Score (g + h)
  parent: IPathNode | null;
}

/**
 * Deterministischer A*-Suchalgorithmus mit Kachelkosten-Matrix
 * - FLOOR: 1.0
 * - COVER_HALF: 2.0 (Erschwerte Bewegung)
 * - HAZARD_RADIATION: 5.0 (KI meidet Schaden)
 * - WALL_FULL / HAZARD_VOID: Unendlich (Blockiert)
 * - Besetzte Kacheln: Unendlich (Kein Stacking)
 */
export function findPathAStar(
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  grid: { type: string }[][],
  occupiedTiles: { x: number; y: number }[]
): { x: number; y: number }[] {
  // Wenn Start gleich Ziel ist
  if (startX === targetX && startY === targetY) {
    return [];
  }

  const openList: IPathNode[] = [];
  const closedSet = new Set<string>();

  const startNode: IPathNode = {
    x: startX,
    y: startY,
    g: 0,
    h: Math.abs(targetX - startX) + Math.abs(targetY - startY),
    f: 0,
    parent: null,
  };
  startNode.f = startNode.g + startNode.h;
  openList.push(startNode);

  while (openList.length > 0) {
    // Finde Knoten mit niedrigstem f-Score
    openList.sort((a, b) => a.f - b.f);
    const current = openList.shift()!;

    // Ziel erreicht? Pfad rückwärts rekonstruieren
    if (current.x === targetX && current.y === targetY) {
      const path: { x: number; y: number }[] = [];
      let temp: IPathNode | null = current;
      while (temp && temp.parent) {
        path.unshift({ x: temp.x, y: temp.y });
        temp = temp.parent;
      }
      return path;
    }

    closedSet.add(`${current.x},${current.y}`);

    // Die vier orthogonalen Nachbarn (Nord, Süd, West, Ost)
    const neighbors = [
      { x: current.x, y: current.y - 1 },
      { x: current.x, y: current.y + 1 },
      { x: current.x - 1, y: current.y },
      { x: current.x + 1, y: current.y },
    ];

    for (const n of neighbors) {
      // Grenzprüfung 10x10
      if (n.x < 0 || n.x >= 10 || n.y < 0 || n.y >= 10) continue;
      if (closedSet.has(`${n.x},${n.y}`)) continue;

      const tile = grid[n.y]?.[n.x];
      if (!tile) continue;

      // Wände oder fremde Einheiten blockieren (außer das eigentliche Ziel)
      const isBlocked = tile.type === 'WALL_FULL' || tile.type === 'HAZARD_VOID';
      const isOccupied = occupiedTiles.some(
        (o) => o.x === n.x && o.y === n.y && !(n.x === targetX && n.y === targetY)
      );
      if (isBlocked || isOccupied) continue;

      // Kachel-Kosten einberechnen
      let stepCost = 1.0;
      if (tile.type === 'COVER_HALF') stepCost = 2.0;
      if (tile.type === 'HAZARD_RADIATION') stepCost = 5.0;

      const gScore = current.g + stepCost;
      let neighborNode = openList.find((o) => o.x === n.x && o.y === n.y);

      if (!neighborNode) {
        neighborNode = {
          x: n.x,
          y: n.y,
          g: gScore,
          h: Math.abs(targetX - n.x) + Math.abs(targetY - n.y),
          f: 0,
          parent: current,
        };
        neighborNode.f = neighborNode.g + neighborNode.h;
        openList.push(neighborNode);
      } else if (gScore < neighborNode.g) {
        neighborNode.g = gScore;
        neighborNode.f = neighborNode.g + neighborNode.h;
        neighborNode.parent = current;
      }
    }
  }

  // Kein Pfad möglich (Ziel eingemauert)
  return [];
}

/**
 * Bresenham Sichtlinien-Prüfung (Line of Sight)
 * Prüft, ob freie Schusslinie ohne blockierende Wände (WALL_FULL) vorliegt.
 */
export function hasClearLineOfSight(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  grid: { type: string }[][]
): boolean {
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  let sx = x0 < x1 ? 1 : -1;
  let sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let cx = x0;
  let cy = y0;

  while (true) {
    if (cx === x1 && cy === y1) break;

    // Start- und Zielkachel werden nicht als Blockade gewertet
    if (!(cx === x0 && cy === y0)) {
      const tile = grid[cy]?.[cx];
      if (!tile || tile.type === 'WALL_FULL') {
        return false;
      }
    }

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      cx += sx;
    }
    if (e2 < dx) {
      err += dx;
      cy += sy;
    }
  }

  return true;
}

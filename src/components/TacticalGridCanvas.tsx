import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ITacticalTile, ICombatEntity, CombatActionType } from '../types/combat';
import { ProceduralAudioEngine } from '../services/audioEngine';

interface TacticalGridCanvasProps {
  grid: ITacticalTile[][];
  entities: ICombatEntity[];
  playerPos: { x: number; y: number };
  targetTile: { x: number; y: number } | null;
  cursorPos: { x: number; y: number };
  selectedAction: CombatActionType;
  reachableTiles: { x: number; y: number }[];
  damageParticles?: { text: string; x: number; y: number; color: string; alpha: number; offsetY: number }[];
  tracerLines?: { startX: number; startY: number; endX: number; endY: number; color: string; life: number }[];
  isSectorCleared?: boolean;
  exitTile?: { x: number; y: number };
  onTileSelect: (pos: { x: number; y: number }) => void;
  onTileHover?: (pos: { x: number; y: number } | null) => void;
}

export const TacticalGridCanvas: React.FC<TacticalGridCanvasProps> = ({
  grid,
  entities,
  playerPos,
  targetTile,
  cursorPos,
  selectedAction,
  reachableTiles,
  damageParticles = [],
  tracerLines = [],
  isSectorCleared = false,
  exitTile = { x: 9, y: 5 },
  onTileSelect,
  onTileHover,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const audio = ProceduralAudioEngine.getInstance();

  const getTileCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;

    const tileSize = Math.min(canvas.width, canvas.height) / 11;
    const offsetX = (canvas.width - 10 * tileSize) / 2;
    const offsetY = (canvas.height - 10 * tileSize) / 2;

    const gx = Math.floor((mx - offsetX) / tileSize);
    const gy = Math.floor((my - offsetY) / tileSize);

    if (gx >= 0 && gx < 10 && gy >= 0 && gy < 10) {
      return { x: gx, y: gy };
    }
    return null;
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getTileCoords(e.clientX, e.clientY);
    if (coords && (coords.x !== hoveredTile?.x || coords.y !== hoveredTile?.y)) {
      setHoveredTile(coords);
      onTileHover?.(coords);
    } else if (!coords && hoveredTile) {
      setHoveredTile(null);
      onTileHover?.(null);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getTileCoords(e.clientX, e.clientY);
    if (coords) {
      audio.playSelectClick();
      onTileSelect(coords);
    }
  };

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = (canvas.width = canvas.parentElement?.clientWidth || 700);
      const h = (canvas.height = canvas.parentElement?.clientHeight || 600);

      // Clear dark phosphor background
      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, w, h);

      const tileSize = Math.min(w, h) / 11;
      const offsetX = (w - 10 * tileSize) / 2;
      const offsetY = (h - 10 * tileSize) / 2;
      const now = performance.now() / 1000;

      // 1. Grid Background & Grid Lines
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.08)';
      ctx.lineWidth = 1;

      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          const px = offsetX + x * tileSize;
          const py = offsetY + y * tileSize;
          const tile = grid[y]?.[x];

          // Base tile outline
          ctx.strokeRect(px, py, tileSize, tileSize);

          // Tile Specific Render
          if (tile) {
            if (tile.type === 'WALL_FULL') {
              // Impassable wall with diagonal hatch pattern
              ctx.fillStyle = 'rgba(100, 116, 139, 0.35)';
              ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
              ctx.strokeStyle = '#64748b';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(px + 2, py + 2);
              ctx.lineTo(px + tileSize - 2, py + tileSize - 2);
              ctx.moveTo(px + tileSize - 2, py + 2);
              ctx.lineTo(px + 2, py + tileSize - 2);
              ctx.stroke();
            } else if (tile.type === 'COVER_HALF') {
              // Half cover obstacle
              ctx.fillStyle = 'rgba(0, 255, 170, 0.12)';
              ctx.fillRect(px + 4, py + 4, tileSize - 8, tileSize - 8);
              ctx.strokeStyle = '#00FFAA';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(px + 6, py + 6, tileSize - 12, tileSize - 12);
            } else if (tile.type === 'HAZARD_RADIATION') {
              // Pulsing radiation zone
              const pulse = 0.15 + 0.1 * Math.sin(now * 4 + x + y);
              ctx.fillStyle = `rgba(230, 57, 70, ${pulse})`;
              ctx.fillRect(px + 1, py + 1, tileSize - 2, tileSize - 2);
              ctx.strokeStyle = 'rgba(230, 57, 70, 0.6)';
              ctx.strokeRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
            } else if (tile.type === 'HAZARD_VOID') {
              // Vacuum breach
              ctx.fillStyle = '#020305';
              ctx.fillRect(px + 1, py + 1, tileSize - 2, tileSize - 2);
              ctx.strokeStyle = 'rgba(147, 51, 234, 0.5)';
              ctx.setLineDash([3, 3]);
              ctx.strokeRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
              ctx.setLineDash([]);
            }
          }
        }
      }

      // 2. Render Reachable Movement/Target Tiles
      if (reachableTiles.length > 0) {
        ctx.fillStyle =
          selectedAction === 'ATTACK'
            ? 'rgba(230, 57, 70, 0.18)'
            : 'rgba(0, 255, 170, 0.15)';
        reachableTiles.forEach((tile) => {
          const px = offsetX + tile.x * tileSize;
          const py = offsetY + tile.y * tileSize;
          ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
        });
      }

      // 3. Render Hovered / Cursor Tile
      if (hoveredTile) {
        const hx = offsetX + hoveredTile.x * tileSize;
        const hy = offsetY + hoveredTile.y * tileSize;
        ctx.strokeStyle = '#00FFAA';
        ctx.lineWidth = 2;
        ctx.strokeRect(hx + 1, hy + 1, tileSize - 2, tileSize - 2);
      }

      // 4. INTENT PROJECTION SYSTEM (Telegrafierte Feind-Absichten)
      let totalIncomingToVance = 0;

      entities.forEach((ent) => {
        if (ent.isPlayer || ent.hp <= 0 || !ent.intent) return;
        const intent = ent.intent;
        const ex = offsetX + ent.x * tileSize + tileSize / 2;
        const ey = offsetY + ent.y * tileSize + tileSize / 2;

        // 4.1 Flächen-Intent (AOE_HAMMER - z.B. 3x3 Boss Hammer)
        if (intent.actionType === 'AOE_HAMMER' && intent.affectedTiles) {
          const pulse = 0.22 + 0.12 * Math.sin(now * 5);
          ctx.fillStyle = `rgba(230, 57, 70, ${pulse})`;
          ctx.strokeStyle = '#E63946';
          ctx.lineWidth = 1.5;

          intent.affectedTiles.forEach((at) => {
            const ax = offsetX + at.x * tileSize;
            const ay = offsetY + at.y * tileSize;
            ctx.fillRect(ax + 2, ay + 2, tileSize - 4, tileSize - 4);

            // Hatching lines
            ctx.beginPath();
            ctx.moveTo(ax + 4, ay + 4);
            ctx.lineTo(ax + tileSize - 4, ay + tileSize - 4);
            ctx.stroke();

            if (at.x === playerPos.x && at.y === playerPos.y) {
              totalIncomingToVance += intent.damagePreview;
            }
          });

          // Center AOE marker
          const cx = offsetX + intent.targetTile.x * tileSize + tileSize / 2;
          const cy = offsetY + intent.targetTile.y * tileSize + tileSize / 2;
          ctx.fillStyle = '#E63946';
          ctx.font = 'bold 8px monospace';
          ctx.fillText('[!] SEISMISCHER EINSCHLAG', cx - 45, cy - tileSize * 0.7);
        }

        // 4.2 Angriffs-Intent (Roter Fadenkreuz-Vektor / Laserlinie)
        if (intent.actionType === 'ATTACK') {
          const tx = offsetX + intent.targetTile.x * tileSize + tileSize / 2;
          const ty = offsetY + intent.targetTile.y * tileSize + tileSize / 2;

          ctx.save();
          ctx.strokeStyle = '#E63946';
          ctx.lineWidth = 1.8;
          ctx.setLineDash([4, 4]);
          ctx.lineDashOffset = -now * 18;

          // Draw laser line
          ctx.beginPath();
          ctx.moveTo(ex, ey);
          ctx.lineTo(tx, ty);
          ctx.stroke();

          // Reticle at target tile
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(230, 57, 70, 0.3)';
          ctx.beginPath();
          ctx.arc(tx, ty, tileSize * 0.25, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#E63946';
          ctx.stroke();

          // Target danger preview tag
          ctx.fillStyle = '#E63946';
          ctx.font = 'bold 8px monospace';
          ctx.fillText(`ZIEL: -${intent.damagePreview} DMG`, tx - 22, ty + tileSize * 0.42);
          ctx.restore();

          if (intent.targetTile.x === playerPos.x && intent.targetTile.y === playerPos.y) {
            totalIncomingToVance += intent.damagePreview;
          }
        }

        // 4.3 Defensiv-Intent (Blauer Schild-Ring)
        if (intent.actionType === 'DEFENSE') {
          ctx.save();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ex, ey, tileSize * 0.42, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 8px monospace';
          ctx.fillText('[SCHILD +40]', ex - 22, ey - tileSize * 0.48);
          ctx.restore();
        }
      });

      // 5. Extraction Airlock (Wenn Sektor gesichert ist)
      if (isSectorCleared && exitTile) {
        const ax = offsetX + exitTile.x * tileSize + tileSize / 2;
        const ay = offsetY + exitTile.y * tileSize + tileSize / 2;

        const pulse = 0.4 + 0.3 * Math.sin(now * 4);
        ctx.fillStyle = `rgba(0, 255, 170, ${pulse * 0.4})`;
        ctx.fillRect(
          offsetX + exitTile.x * tileSize + 2,
          offsetY + exitTile.y * tileSize + 2,
          tileSize - 4,
          tileSize - 4
        );

        ctx.strokeStyle = '#00FFAA';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ax, ay, tileSize * 0.35 + Math.sin(now * 3) * 3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#00FFAA';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('SCHLEUSE', ax - 18, ay + tileSize * 0.45);
      }

      // 6. Drone Unit: Scarab-IV (Begleitdrohne)
      const drone = entities.find((e) => e.isDrone && e.hp > 0);
      if (drone) {
        const dx = offsetX + drone.x * tileSize + tileSize / 2;
        const dy = offsetY + drone.y * tileSize + tileSize / 2;

        // Hover pulsation
        const hoverOffset = Math.sin(now * 5) * 2;
        ctx.fillStyle = '#00FFAA';
        ctx.beginPath();
        ctx.moveTo(dx, dy - tileSize * 0.2 + hoverOffset);
        ctx.lineTo(dx + tileSize * 0.18, dy + tileSize * 0.15 + hoverOffset);
        ctx.lineTo(dx - tileSize * 0.18, dy + tileSize * 0.15 + hoverOffset);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#00FFAA';
        ctx.font = '8px monospace';
        ctx.fillText('SCARAB', dx - 14, dy + tileSize * 0.35);
      }

      // 7. Render Entities (Player & Enemies)
      entities.forEach((ent) => {
        if (ent.hp <= 0) return;
        const ex = offsetX + ent.x * tileSize + tileSize / 2;
        const ey = offsetY + ent.y * tileSize + tileSize / 2;

        if (ent.isPlayer) {
          // Operative Vance
          ctx.fillStyle = '#00FFAA';
          ctx.shadowColor = '#00FFAA';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(ex, ey, tileSize * 0.32, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Inner chevron indicator
          ctx.fillStyle = '#06080d';
          ctx.beginPath();
          ctx.arc(ex, ey, tileSize * 0.12, 0, Math.PI * 2);
          ctx.fill();

          // Label
          ctx.fillStyle = '#00FFAA';
          ctx.font = 'bold 9px monospace';
          ctx.fillText('VANCE', ex - 14, ey - tileSize * 0.38);

          // Danger Warning if targeted by enemy
          if (totalIncomingToVance > 0) {
            const tagY = ey - tileSize * 0.65;
            ctx.fillStyle = 'rgba(230, 57, 70, 0.9)';
            ctx.fillRect(ex - 42, tagY - 9, 84, 13);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 8px monospace';
            ctx.fillText(`! GEFÄHRDET: ${totalIncomingToVance} DMG`, ex - 40, tagY);
          }
        } else if (!ent.isDrone) {
          // Enemy Entity
          const isBoss = ent.archetype === 'BOSS_NILUS' || ent.isBoss;
          ctx.fillStyle = ent.color || (isBoss ? '#E63946' : '#E07A5F');
          ctx.shadowColor = ent.color || '#E07A5F';
          ctx.shadowBlur = isBoss ? 16 : 8;

          ctx.beginPath();
          if (isBoss) {
            // Boss 2x2 Chassis Silhouette
            ctx.rect(ex - tileSize * 0.42, ey - tileSize * 0.42, tileSize * 0.84, tileSize * 0.84);
          } else if (ent.archetype === 'PRAETOR') {
            // Praetor Mech Octagon
            ctx.rect(ex - tileSize * 0.32, ey - tileSize * 0.32, tileSize * 0.64, tileSize * 0.64);
          } else {
            // Creeper triangle
            ctx.arc(ex, ey, tileSize * 0.3, 0, Math.PI * 2);
          }
          ctx.fill();
          ctx.shadowBlur = 0;

          // Boss glowing power core
          if (isBoss) {
            ctx.fillStyle = '#FFE600';
            ctx.beginPath();
            ctx.arc(ex, ey, tileSize * 0.16, 0, Math.PI * 2);
            ctx.fill();
          }

          // Health bar above enemy
          const barW = tileSize * 0.85;
          const barH = isBoss ? 5 : 3;
          const barX = ex - barW / 2;
          const barY = ey - tileSize * 0.46;

          ctx.fillStyle = '#1A202C';
          ctx.fillRect(barX, barY, barW, barH);
          ctx.fillStyle = isBoss ? '#E63946' : '#E07A5F';
          ctx.fillRect(barX, barY, barW * (ent.hp / ent.maxHp), barH);

          // Shield bar if shielded
          if (ent.shield > 0) {
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(barX, barY - 2, barW * (ent.shield / ent.maxShield), 2);
          }

          // Name & Phase label
          ctx.fillStyle = isBoss ? '#E63946' : '#E07A5F';
          ctx.font = '8px monospace';
          const bossTag = isBoss && ent.bossPhase ? ` [PH${ent.bossPhase}]` : '';
          ctx.fillText(`${ent.name.slice(0, 10)}${bossTag}`, ex - 22, ey + tileSize * 0.44);
        }
      });

      // 8. Action-Targeting Reticle
      if (targetTile) {
        const tx = offsetX + targetTile.x * tileSize + tileSize / 2;
        const ty = offsetY + targetTile.y * tileSize + tileSize / 2;
        const reticleSize = tileSize * 0.45;

        ctx.strokeStyle = '#00FFAA';
        ctx.lineWidth = 1.5;

        // Corner brackets
        const b = reticleSize;
        ctx.beginPath();
        // Top-Left
        ctx.moveTo(tx - b, ty - b + 6);
        ctx.lineTo(tx - b, ty - b);
        ctx.lineTo(tx - b + 6, ty - b);
        // Top-Right
        ctx.moveTo(tx + b - 6, ty - b);
        ctx.lineTo(tx + b, ty - b);
        ctx.lineTo(tx + b, ty - b + 6);
        // Bottom-Right
        ctx.moveTo(tx + b, ty + b - 6);
        ctx.lineTo(tx + b, ty + b);
        ctx.lineTo(tx + b - 6, ty + b);
        // Bottom-Left
        ctx.moveTo(tx - b + 6, ty + b);
        ctx.lineTo(tx - b, ty + b);
        ctx.lineTo(tx - b, ty + b - 6);
        ctx.stroke();

        ctx.fillStyle = '#00FFAA';
        ctx.font = '8px monospace';
        ctx.fillText(`ZIEL: (${targetTile.x}, ${targetTile.y})`, tx - 22, ty + reticleSize + 10);
      }

      // 9. Render Projectile Tracer Lines
      if (tracerLines && tracerLines.length > 0) {
        tracerLines.forEach((tracer) => {
          const sx = offsetX + tracer.startX * tileSize + tileSize / 2;
          const sy = offsetY + tracer.startY * tileSize + tileSize / 2;
          const ex = offsetX + tracer.endX * tileSize + tileSize / 2;
          const ey = offsetY + tracer.endY * tileSize + tileSize / 2;

          ctx.save();
          ctx.strokeStyle = tracer.color;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = tracer.color;
          ctx.shadowBlur = 10;
          ctx.globalAlpha = Math.max(0, tracer.life);

          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
          ctx.stroke();

          // Muzzle flash spark at start
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(sx, sy, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        });
      }

      // 10. Render Floating Damage Numbers
      if (damageParticles && damageParticles.length > 0) {
        damageParticles.forEach((dp) => {
          const px = offsetX + dp.x * tileSize + tileSize / 2;
          const py = offsetY + dp.y * tileSize + tileSize / 2 - dp.offsetY;

          ctx.save();
          ctx.fillStyle = dp.color;
          ctx.globalAlpha = Math.max(0, dp.alpha);
          ctx.font = 'bold 13px monospace';
          ctx.shadowColor = dp.color;
          ctx.shadowBlur = 8;
          ctx.fillText(dp.text, px - 20, py);
          ctx.restore();
        });
      }

      // 11. Coordinate Axis Labels (0-9)
      ctx.fillStyle = 'rgba(0, 255, 170, 0.4)';
      ctx.font = '8px monospace';
      for (let i = 0; i < 10; i++) {
        // X-axis top
        ctx.fillText(i.toString(), offsetX + i * tileSize + tileSize / 2 - 3, offsetY - 6);
        // Y-axis left
        ctx.fillText(i.toString(), offsetX - 12, offsetY + i * tileSize + tileSize / 2 + 3);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    grid,
    entities,
    playerPos,
    targetTile,
    hoveredTile,
    reachableTiles,
    damageParticles,
    tracerLines,
    selectedAction,
    isSectorCleared,
    exitTile,
  ]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#070a0e] select-none overflow-hidden">
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        className="cursor-crosshair w-full h-full max-w-[750px] max-h-[750px]"
      />
    </div>
  );
};

import React, { useRef, useEffect, useCallback } from 'react';
import { IDualTile } from '../types/endgame';

interface DualGridCanvasProps {
  gridA: IDualTile[][];
  gridB: IDualTile[][];
  vancePos: { x: number; y: number };
  dronePos: { x: number; y: number };
  activeEpoch: 'PAST' | 'FUTURE';
  onTileClick?: (gridType: 'PAST' | 'FUTURE', x: number, y: number) => void;
}

export const DualGridCanvas: React.FC<DualGridCanvasProps> = ({
  gridA,
  gridB,
  vancePos,
  dronePos,
  activeEpoch,
  onTileClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Helper function to draw sub-grids
  const drawSubGrid = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      grid: IDualTile[][],
      entityPos: { x: number; y: number },
      tileSize: number,
      themeColor: string,
      label: string,
      entityGlyph: string,
      isActiveEpoch: boolean,
      now: number
    ) => {
      // Header Label
      ctx.fillStyle = themeColor;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `[ZEITACHSE: ${label}] ${isActiveEpoch ? '◄ AKTIV' : ''}`,
        0,
        -12
      );

      // Grid background area
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, 0, 8 * tileSize, 8 * tileSize);

      // Draw Tiles
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const tile = grid[y]?.[x];
          if (!tile) continue;

          const px = x * tileSize;
          const py = y * tileSize;

          // Tile boundary
          ctx.strokeStyle = tile.blocked ? themeColor : 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, tileSize - 2, tileSize - 2);

          // Tile Interior
          if (tile.objectType === 'TERMINAL') {
            if (tile.terminalActive) {
              const pulse = 0.5 + 0.5 * Math.sin(now * 4);
              ctx.fillStyle = `rgba(0, 255, 170, ${0.25 + pulse * 0.25})`;
              ctx.fillRect(px, py, tileSize - 2, tileSize - 2);

              // Terminal Icon
              ctx.strokeStyle = '#00FFAA';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(px + 6, py + 6, tileSize - 14, tileSize - 14);

              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 9px monospace';
              ctx.textAlign = 'center';
              ctx.fillText('TERM', px + tileSize / 2, py + tileSize / 2 + 3);
            } else {
              // Destroyed terminal
              ctx.fillStyle = 'rgba(80, 80, 80, 0.3)';
              ctx.fillRect(px, py, tileSize - 2, tileSize - 2);
              ctx.fillStyle = '#888888';
              ctx.font = '8px monospace';
              ctx.textAlign = 'center';
              ctx.fillText('OFF', px + tileSize / 2, py + tileSize / 2 + 3);
            }
          } else if (tile.objectType === 'DOOR') {
            if (tile.doorOpen) {
              // Open doorway (free passage)
              ctx.fillStyle = 'rgba(0, 255, 170, 0.15)';
              ctx.fillRect(px, py, tileSize - 2, tileSize - 2);

              ctx.strokeStyle = '#00FFAA';
              ctx.setLineDash([2, 2]);
              ctx.strokeRect(px + 4, py + 4, tileSize - 10, tileSize - 10);
              ctx.setLineDash([]);

              ctx.fillStyle = '#00FFAA';
              ctx.font = '8px monospace';
              ctx.textAlign = 'center';
              ctx.fillText('OFFEN', px + tileSize / 2, py + tileSize / 2 + 3);
            } else {
              // Locked barrier
              const pulse = 0.5 + 0.5 * Math.sin(now * 3);
              ctx.fillStyle = `rgba(224, 122, 95, ${0.4 + pulse * 0.3})`;
              ctx.fillRect(px, py, tileSize - 2, tileSize - 2);

              ctx.strokeStyle = '#E07A5F';
              ctx.lineWidth = 2;
              // Crossed door barrier
              ctx.beginPath();
              ctx.moveTo(px + 4, py + 4);
              ctx.lineTo(px + tileSize - 6, py + tileSize - 6);
              ctx.moveTo(px + tileSize - 6, py + 4);
              ctx.lineTo(px + 4, py + tileSize - 6);
              ctx.stroke();
            }
          } else if (tile.objectType === 'CHRONO_CORE') {
            // Shiny rotating core
            const pulse = 0.5 + 0.5 * Math.sin(now * 5);
            ctx.fillStyle = `rgba(245, 158, 11, ${0.3 + pulse * 0.3})`;
            ctx.fillRect(px, py, tileSize - 2, tileSize - 2);

            ctx.save();
            ctx.translate(px + tileSize / 2, py + tileSize / 2);
            ctx.rotate(now * 2);
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2;
            ctx.strokeRect(-8, -8, 16, 16);
            ctx.restore();

            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('KERN', px + tileSize / 2, py + tileSize / 2 + 14);
          } else if (tile.blocked) {
            ctx.fillStyle = `${themeColor}22`;
            ctx.fillRect(px, py, tileSize - 2, tileSize - 2);

            ctx.fillStyle = `${themeColor}66`;
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('■', px + tileSize / 2, py + tileSize / 2 + 3);
          }
        }
      }

      // Draw Entity
      const ex = entityPos.x * tileSize + tileSize / 2;
      const ey = entityPos.y * tileSize + tileSize / 2;

      // Glow behind entity
      const grad = ctx.createRadialGradient(ex, ey, 2, ex, ey, tileSize * 0.6);
      grad.addColorStop(0, `${themeColor}aa`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ex, ey, tileSize * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Entity Circle
      ctx.fillStyle = themeColor;
      ctx.beginPath();
      ctx.arc(ex, ey, tileSize * 0.32, 0, Math.PI * 2);
      ctx.fill();

      // Entity Glyph
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(entityGlyph, ex, ey);

      // Active Epoch Indicator Box
      if (isActiveEpoch) {
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(-4, -4, 8 * tileSize + 8, 8 * tileSize + 8);
      }
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Clear Canvas
      ctx.fillStyle = '#060a0f';
      ctx.fillRect(0, 0, width, height);

      const halfWidth = width / 2;
      const tileSize = Math.floor(Math.min((halfWidth - 48) / 8, (height - 60) / 8));
      const gridWidth = 8 * tileSize;
      const gridHeight = 8 * tileSize;

      const topOffset = Math.max(30, (height - gridHeight) / 2);
      const leftOffsetA = Math.max(20, (halfWidth - gridWidth) / 2);
      const leftOffsetB = halfWidth + Math.max(20, (halfWidth - gridWidth) / 2);

      const now = performance.now() / 1000;

      // 1. Grid A (Vergangenheit: Cyan #00FFAA)
      ctx.save();
      ctx.translate(leftOffsetA, topOffset);
      drawSubGrid(
        ctx,
        gridA,
        vancePos,
        tileSize,
        '#00FFAA',
        'VERGANGENHEIT [VANCE]',
        'V',
        activeEpoch === 'PAST',
        now
      );
      ctx.restore();

      // 2. Central Bifurcation Divider
      ctx.strokeStyle = 'rgba(224, 122, 95, 0.45)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(halfWidth, 10);
      ctx.lineTo(halfWidth, height - 10);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center causality emblem
      const emblemPulse = 0.5 + 0.5 * Math.sin(now * 3);
      ctx.fillStyle = `rgba(245, 158, 11, ${0.4 + emblemPulse * 0.4})`;
      ctx.beginPath();
      ctx.arc(halfWidth, height / 2, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('∞', halfWidth, height / 2);

      // 3. Grid B (Zukunft: Rost-Bernstein #E07A5F)
      ctx.save();
      ctx.translate(leftOffsetB, topOffset);
      drawSubGrid(
        ctx,
        gridB,
        dronePos,
        tileSize,
        '#E07A5F',
        'ZUKUNFT [SCARAB-IV]',
        'D',
        activeEpoch === 'FUTURE',
        now
      );
      ctx.restore();

      // 4. Draw Animated Quantum Entanglement Vectors between linked tiles
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const tileA = gridA[y]?.[x];
          if (tileA?.hasCausalityLink && tileA.linkedTilePos) {
            const linked = tileA.linkedTilePos;
            const tileB = gridB[linked.y]?.[linked.x];

            const p1x = leftOffsetA + x * tileSize + tileSize / 2;
            const p1y = topOffset + y * tileSize + tileSize / 2;
            const p2x = leftOffsetB + linked.x * tileSize + tileSize / 2;
            const p2y = topOffset + linked.y * tileSize + tileSize / 2;

            ctx.beginPath();
            ctx.moveTo(p1x, p1y);
            const midX = halfWidth;
            const midY = (p1y + p2y) / 2;
            ctx.bezierCurveTo(midX, p1y, midX, p2y, p2x, p2y);

            const isResolved = !tileA.terminalActive || tileB?.doorOpen;
            if (isResolved) {
              ctx.strokeStyle = 'rgba(0, 255, 170, 0.7)';
              ctx.lineWidth = 2;
              ctx.setLineDash([4, 4]);
            } else {
              const linePulse = 0.4 + 0.4 * Math.sin(now * 5);
              ctx.strokeStyle = `rgba(245, 158, 11, ${linePulse})`;
              ctx.lineWidth = 1.5;
              ctx.setLineDash([6, 6]);
            }
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [gridA, gridB, vancePos, dronePos, activeEpoch, drawSubGrid]);

  // Click handler
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !onTileClick) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const halfWidth = width / 2;

    const tileSize = Math.floor(Math.min((halfWidth - 48) / 8, (height - 60) / 8));
    const gridWidth = 8 * tileSize;
    const gridHeight = 8 * tileSize;
    const topOffset = Math.max(30, (height - gridHeight) / 2);

    if (clickX < halfWidth) {
      // Clicked on Grid A
      const leftOffsetA = Math.max(20, (halfWidth - gridWidth) / 2);
      const gx = Math.floor((clickX - leftOffsetA) / tileSize);
      const gy = Math.floor((clickY - topOffset) / tileSize);
      if (gx >= 0 && gx < 8 && gy >= 0 && gy < 8) {
        onTileClick('PAST', gx, gy);
      }
    } else {
      // Clicked on Grid B
      const leftOffsetB = halfWidth + Math.max(20, (halfWidth - gridWidth) / 2);
      const gx = Math.floor((clickX - leftOffsetB) / tileSize);
      const gy = Math.floor((clickY - topOffset) / tileSize);
      if (gx >= 0 && gx < 8 && gy >= 0 && gy < 8) {
        onTileClick('FUTURE', gx, gy);
      }
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#05080c]">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        className="w-full h-full cursor-crosshair block"
      />
    </div>
  );
};

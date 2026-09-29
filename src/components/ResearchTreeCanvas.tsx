import React, { useRef, useEffect, useState, useCallback } from 'react';
import { IResearchNode } from '../types/economy';

interface ResearchTreeCanvasProps {
  nodes: IResearchNode[];
  availableCrystals: number;
  selectedNodeId: string | null;
  onSelectNode: (node: IResearchNode) => void;
  onUnlockNode?: (node: IResearchNode) => void;
}

export const ResearchTreeCanvas: React.FC<ResearchTreeCanvasProps> = ({
  nodes,
  availableCrystals,
  selectedNodeId,
  onSelectNode,
  onUnlockNode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Helper to map normalized coordinates to canvas pixel space
  const getNodePos = useCallback((node: IResearchNode, width: number, height: number) => {
    const padX = 40;
    const padY = 50;
    const effW = width - padX * 2;
    const effH = height - padY * 2;
    return {
      x: padX + node.x * effW,
      y: padY + node.y * effH,
    };
  }, []);

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

      // Clear background
      ctx.fillStyle = '#060a0f';
      ctx.fillRect(0, 0, width, height);

      // Subtle cybernetic grid background
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 32;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const now = performance.now() / 1000;
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));

      // 1. Draw connection lines between nodes
      for (const node of nodes) {
        if (!node.requiredNodeId) continue;
        const parent = nodeMap.get(node.requiredNodeId);
        if (!parent) continue;

        const p1 = getNodePos(parent, width, height);
        const p2 = getNodePos(node, width, height);

        const isParentUnlocked = parent.unlocked;
        const isPathActive = node.unlocked;
        const canUnlockChild = isParentUnlocked && !node.unlocked;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        // Stylized 90-degree or curved connector
        const midY = (p1.y + p2.y) / 2;
        ctx.bezierCurveTo(p1.x, midY, p2.x, midY, p2.x, p2.y);

        if (isPathActive) {
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = 'rgba(0, 240, 255, 0.8)';
          ctx.shadowBlur = 8;
          ctx.setLineDash([]);
        } else if (canUnlockChild) {
          const pulse = 0.5 + 0.5 * Math.sin(now * 3);
          ctx.strokeStyle = `rgba(255, 184, 0, ${0.4 + pulse * 0.4})`;
          ctx.lineWidth = 1.5;
          ctx.shadowColor = 'rgba(255, 184, 0, 0.5)';
          ctx.shadowBlur = 4;
          ctx.setLineDash([4, 4]);
        } else {
          ctx.strokeStyle = 'rgba(70, 85, 100, 0.35)';
          ctx.lineWidth = 1;
          ctx.shadowBlur = 0;
          ctx.setLineDash([2, 4]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
      }

      // 2. Draw nodes
      for (const node of nodes) {
        const { x, y } = getNodePos(node, width, height);
        const isSelected = selectedNodeId === node.id;
        const isHovered = hoveredNodeId === node.id;
        const parent = node.requiredNodeId ? nodeMap.get(node.requiredNodeId) : null;
        const isAvailable =
          !node.unlocked && (!parent || parent.unlocked) && availableCrystals >= node.costCrystals;
        const isAffordableWarning =
          !node.unlocked && (!parent || parent.unlocked) && availableCrystals < node.costCrystals;

        const radius = node.tier === 0 ? 18 : node.tier === 5 ? 20 : 15;

        // Outer glow
        if (isSelected || node.unlocked || isAvailable) {
          const glowRadius = radius + (isAvailable ? 4 + 2 * Math.sin(now * 4) : 4);
          const grad = ctx.createRadialGradient(x, y, radius * 0.5, x, y, glowRadius + 8);

          if (node.unlocked) {
            grad.addColorStop(0, 'rgba(0, 240, 255, 0.3)');
            grad.addColorStop(1, 'rgba(0, 240, 255, 0)');
          } else if (isAvailable) {
            grad.addColorStop(0, 'rgba(255, 184, 0, 0.35)');
            grad.addColorStop(1, 'rgba(255, 184, 0, 0)');
          } else {
            grad.addColorStop(0, 'rgba(0, 240, 255, 0.2)');
            grad.addColorStop(1, 'rgba(0, 240, 255, 0)');
          }

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, glowRadius + 8, 0, Math.PI * 2);
          ctx.fill();
        }

        // Node base circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);

        if (node.unlocked) {
          ctx.fillStyle = '#082535';
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = isSelected ? 3 : 2;
        } else if (isAvailable) {
          ctx.fillStyle = '#261c06';
          ctx.strokeStyle = '#ffb800';
          ctx.lineWidth = isSelected ? 3 : 2;
        } else if (isAffordableWarning) {
          ctx.fillStyle = '#171a22';
          ctx.strokeStyle = '#8d753b';
          ctx.lineWidth = isSelected ? 2.5 : 1.5;
        } else {
          ctx.fillStyle = '#0e1319';
          ctx.strokeStyle = '#323c48';
          ctx.lineWidth = 1;
        }

        ctx.fill();
        ctx.stroke();

        // Inner shape / glyph
        if (node.tier === 0) {
          // Origin diamond
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(now * 0.5);
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-6, -6, 12, 12);
          ctx.restore();
        } else if (node.tier === 5) {
          // Apex star / double hexagon
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(-now * 0.8);
          ctx.strokeStyle = node.unlocked ? '#00f0ff' : '#ffb800';
          ctx.lineWidth = 2;
          ctx.strokeRect(-8, -8, 16, 16);
          ctx.rotate(Math.PI / 4);
          ctx.strokeRect(-8, -8, 16, 16);
          ctx.restore();
        } else {
          // Inner dot
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fillStyle = node.unlocked ? '#00f0ff' : isAvailable ? '#ffb800' : '#455565';
          ctx.fill();
        }

        // Selection reticle
        if (isSelected) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Node Label
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        if (node.unlocked) {
          ctx.fillStyle = '#00f0ff';
        } else if (isAvailable) {
          ctx.fillStyle = '#ffb800';
        } else {
          ctx.fillStyle = '#657788';
        }

        // Short title (split number if any)
        const shortName = node.title.replace(/^\d+\.\s*/, '');
        ctx.fillText(shortName, x, y + radius + 4);

        // Price tag under label
        if (!node.unlocked) {
          ctx.font = '9px monospace';
          ctx.fillStyle = isAvailable ? '#ffea79' : '#885533';
          ctx.fillText(`${node.costCrystals} CK`, x, y + radius + 16);
        } else {
          ctx.font = '8px monospace';
          ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
          ctx.fillText('AKTIV', x, y + radius + 16);
        }
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [nodes, availableCrystals, selectedNodeId, hoveredNodeId, getNodePos]);

  // Click & hover handling
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    for (const node of nodes) {
      const { x, y } = getNodePos(node, canvas.clientWidth, canvas.clientHeight);
      const dist = Math.hypot(clickX - x, clickY - y);
      const hitRadius = 24;

      if (dist <= hitRadius) {
        onSelectNode(node);
        if (e.detail === 2 && onUnlockNode) {
          onUnlockNode(node);
        }
        return;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let found: string | null = null;
    for (const node of nodes) {
      const { x, y } = getNodePos(node, canvas.clientWidth, canvas.clientHeight);
      if (Math.hypot(mouseX - x, mouseY - y) <= 24) {
        found = node.id;
        break;
      }
    }
    setHoveredNodeId(found);
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0a1017] border-b border-[#00f0ff]/30 text-xs text-[#00f0ff]">
        <span className="font-bold tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
          QUANTUM RESEARCH MATRIX // PERSISTENTER GRAPH
        </span>
        <span className="text-[10px] text-[#78909c]">
          KLICKEN ZUM WÄHLEN // DOPPELKLICK ZUM FREISCHALTEN
        </span>
      </div>
      <div className="relative flex-1 bg-black">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoveredNodeId(null)}
          className="w-full h-full cursor-crosshair block"
        />
      </div>
    </div>
  );
};

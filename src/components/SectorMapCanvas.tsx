import React, { useEffect, useRef, useState } from 'react';
import { IMapNode, MapNodeType } from '../types/mission';
import { ProceduralAudioEngine } from '../services/audioEngine';

interface SectorMapCanvasProps {
  nodes: IMapNode[];
  selectedNodeId: string;
  onSelectNode: (node: IMapNode) => void;
  isLaunching?: boolean;
}

const NODE_COLORS: Record<MapNodeType, string> = {
  COMBAT: '#E07A5F',   // Rust-Red
  SALVAGE: '#00FFAA',  // Ion-Cyan
  HAZARD: '#FFB703',   // Hazard-Amber
  EVENT: '#8D99AE',    // Slate
  BOSS: '#E63946',     // Blood-Red
};

export const SectorMapCanvas: React.FC<SectorMapCanvasProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
  isLaunching = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const audio = ProceduralAudioEngine.getInstance();

  // Mouse / Pointer Move for Hit-Testing
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found: IMapNode | null = null;
    const hitRadius = 24;

    for (const node of nodes) {
      const nx = node.x * canvas.width;
      const ny = node.y * canvas.height;
      if (Math.hypot(mx - nx, my - ny) < hitRadius) {
        found = node;
        break;
      }
    }

    if (found?.id !== hoveredNodeId) {
      if (found) {
        audio.playHoverPing();
      }
      setHoveredNodeId(found ? found.id : null);
    }
  };

  // Pointer Down to select node
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (const node of nodes) {
      const nx = node.x * canvas.width;
      const ny = node.y * canvas.height;
      if (Math.hypot(mx - nx, my - ny) < 28) {
        audio.playNodeSelectPing();
        onSelectNode(node);
        break;
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = (timestamp: number) => {
      const w = canvas.width;
      const h = canvas.height;

      // 1. Dark Phosphor Persistence background
      ctx.fillStyle = '#06090e';
      ctx.fillRect(0, 0, w, h);

      // Background topological grid lines
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.05)';
      ctx.lineWidth = 1;
      const step = 32;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 2. Connection lines between DAG nodes
      nodes.forEach((node) => {
        const nx = node.x * w;
        const ny = node.y * h;

        node.connections.forEach((targetId) => {
          const target = nodes.find((n) => n.id === targetId);
          if (!target) return;
          const tx = target.x * w;
          const ty = target.y * h;

          const isPathActive = (node.completed || node.active) && target.active;
          const isHoverLink = hoveredNodeId === node.id || hoveredNodeId === target.id;

          ctx.strokeStyle = isPathActive
            ? '#00FFAA'
            : isHoverLink
            ? 'rgba(0, 255, 170, 0.6)'
            : 'rgba(0, 255, 170, 0.15)';
          ctx.lineWidth = isPathActive ? 2.5 : isHoverLink ? 1.8 : 1;
          ctx.setLineDash(isPathActive ? [] : [5, 4]);

          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(tx, ty);
          ctx.stroke();
        });
      });
      ctx.setLineDash([]); // Reset dash

      // 3. Render Node points
      nodes.forEach((node) => {
        const nx = node.x * w;
        const ny = node.y * h;
        const isSelected = node.id === selectedNodeId;
        const isHovered = node.id === hoveredNodeId;

        const nodeColor = NODE_COLORS[node.type] || '#00FFAA';

        // Outer pulsing ring when active or selected
        if (node.active || isSelected || isHovered) {
          const pulse = Math.sin(timestamp * 0.008) * 3 + (isSelected ? 18 : 14);
          ctx.strokeStyle = nodeColor;
          ctx.lineWidth = isSelected ? 3 : isHovered ? 2 : 1.5;
          ctx.shadowColor = nodeColor;
          ctx.shadowBlur = isSelected ? 18 : 8;

          ctx.beginPath();
          ctx.arc(nx, ny, pulse, 0, Math.PI * 2);
          ctx.stroke();

          // Reticle tick crosshairs
          ctx.beginPath();
          ctx.moveTo(nx - pulse - 3, ny);
          ctx.lineTo(nx - pulse + 2, ny);
          ctx.moveTo(nx + pulse - 2, ny);
          ctx.lineTo(nx + pulse + 3, ny);
          ctx.stroke();

          ctx.shadowBlur = 0; // reset
        }

        // Inner solid core
        ctx.fillStyle = node.completed ? '#1A202C' : nodeColor;
        ctx.beginPath();
        ctx.arc(nx, ny, isSelected ? 9 : 7, 0, Math.PI * 2);
        ctx.fill();

        // White highlight for selected node center
        if (isSelected) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Text labels
        ctx.fillStyle = isSelected ? '#FFFFFF' : isHovered ? nodeColor : 'rgba(216, 226, 220, 0.75)';
        ctx.font = isSelected || isHovered ? 'bold 11px monospace' : '10px monospace';
        ctx.fillText(`[${node.label}]`, nx - 22, ny + 26);
      });

      // 4. Sector Watermark
      ctx.fillStyle = 'rgba(0, 255, 170, 0.4)';
      ctx.font = '9px monospace';
      ctx.fillText('TOPOLOGIE-GRAPH // DIRECTED ACYCLIC GRAPH (DAG) // STRATUM-09', 14, h - 14);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [nodes, selectedNodeId, hoveredNodeId]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerLeave={() => setHoveredNodeId(null)}
        className={`w-full h-full block cursor-crosshair transition-all duration-500 ${
          isLaunching ? 'scale-[3.5] opacity-0' : 'scale-100 opacity-100'
        }`}
      />
      <div className="absolute top-3 left-3 text-[10px] font-mono text-cyan-500/80 bg-black/60 px-2 py-1 border border-cyan-900/60 pointer-events-none">
        [KARTEN-TOPOLOGIE // INFILTRATIONS-PFAD WÄHLEN]
      </div>
    </div>
  );
};

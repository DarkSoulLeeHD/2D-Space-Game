import React, { useEffect, useRef, useState } from 'react';
import { WeaponSlotType, IWeaponChassis } from '../types/arsenal';
import { ProceduralAudioEngine } from '../services/audioEngine';

interface WeaponBlueprintCanvasProps {
  weapon: IWeaponChassis;
  selectedSocketId: WeaponSlotType | null;
  onSelectSocket: (socket: WeaponSlotType) => void;
  isFoldAnimating?: boolean;
}

interface ISocketDef {
  id: WeaponSlotType;
  label: string;
  rx: number; // 0.0 - 1.0 relative coords
  ry: number;
}

const SOCKET_DEFS: ISocketDef[] = [
  { id: 'barrel', label: 'LAUF', rx: 0.18, ry: 0.44 },
  { id: 'optic', label: 'OPTIK', rx: 0.52, ry: 0.28 },
  { id: 'body', label: 'VERSCHLUSS', rx: 0.56, ry: 0.44 },
  { id: 'magazine', label: 'MAGAZIN', rx: 0.47, ry: 0.72 },
  { id: 'stock', label: 'SCHAFT', rx: 0.82, ry: 0.48 },
  { id: 'catalyst', label: 'CHRONO', rx: 0.64, ry: 0.52 },
];

export const WeaponBlueprintCanvas: React.FC<WeaponBlueprintCanvasProps> = ({
  weapon,
  selectedSocketId,
  onSelectSocket,
  isFoldAnimating = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredSocketId, setHoveredSocketId] = useState<WeaponSlotType | null>(null);
  const audio = ProceduralAudioEngine.getInstance();

  // Mouse / Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found: WeaponSlotType | null = null;
    const hitRadius = 24;

    for (const s of SOCKET_DEFS) {
      const sx = s.rx * canvas.width;
      const sy = s.ry * canvas.height;
      if (Math.hypot(mx - sx, my - sy) < hitRadius) {
        found = s.id;
        break;
      }
    }

    if (found !== hoveredSocketId) {
      if (found) {
        audio.playHoverPing();
      }
      setHoveredSocketId(found);
    }
  };

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (const s of SOCKET_DEFS) {
      const sx = s.rx * canvas.width;
      const sy = s.ry * canvas.height;
      if (Math.hypot(mx - sx, my - sy) < 28) {
        audio.playSelectClick();
        onSelectSocket(s.id);
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

      // 1. Technical background
      ctx.fillStyle = '#06090e';
      ctx.fillRect(0, 0, w, h);

      // 2. Blueprint CAD grid lines
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 3. Central Weapon Chassis Outline (ARC-70 / Volt)
      const scale = Math.min(w / 800, h / 500);
      const cx = w * 0.48;
      const cy = h * 0.48;

      ctx.save();
      ctx.translate(cx, cy);

      // Implosion animation if fold animating
      if (isFoldAnimating) {
        ctx.scale(0.1, 0.1);
      }

      // Main Receiver & Barrel Geometry
      ctx.strokeStyle = '#00FFAA';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(0, 255, 170, 0.5)';
      ctx.shadowBlur = 8;

      // Receiver Chamber
      ctx.beginPath();
      ctx.moveTo(-220 * scale, -25 * scale);
      ctx.lineTo(140 * scale, -25 * scale);
      ctx.lineTo(190 * scale, 20 * scale);
      ctx.lineTo(130 * scale, 55 * scale);
      ctx.lineTo(20 * scale, 55 * scale);
      ctx.lineTo(-20 * scale, 130 * scale); // Grip
      ctx.lineTo(-75 * scale, 130 * scale);
      ctx.lineTo(-50 * scale, 55 * scale);
      ctx.lineTo(-220 * scale, 55 * scale);
      ctx.closePath();
      ctx.stroke();

      // Barrel Extender (Front)
      ctx.beginPath();
      ctx.moveTo(-220 * scale, -12 * scale);
      ctx.lineTo(-310 * scale, -12 * scale);
      ctx.lineTo(-310 * scale, 25 * scale);
      ctx.lineTo(-220 * scale, 25 * scale);
      ctx.stroke();

      // Muzzle Brake
      ctx.strokeRect(-325 * scale, -18 * scale, 15 * scale, 48 * scale);

      // Stock Skeleton (Back)
      ctx.beginPath();
      ctx.moveTo(140 * scale, -20 * scale);
      ctx.lineTo(260 * scale, 10 * scale);
      ctx.lineTo(270 * scale, 85 * scale);
      ctx.lineTo(235 * scale, 85 * scale);
      ctx.lineTo(185 * scale, 25 * scale);
      ctx.stroke();

      // Optic Holo Rail & Scope
      ctx.strokeRect(-40 * scale, -55 * scale, 90 * scale, 25 * scale);
      ctx.beginPath();
      ctx.moveTo(-15 * scale, -30 * scale);
      ctx.lineTo(-15 * scale, -25 * scale);
      ctx.moveTo(25 * scale, -30 * scale);
      ctx.lineTo(25 * scale, -25 * scale);
      ctx.stroke();

      // Energy Magazine Well
      ctx.beginPath();
      ctx.moveTo(-35 * scale, 55 * scale);
      ctx.lineTo(-15 * scale, 140 * scale);
      ctx.lineTo(25 * scale, 140 * scale);
      ctx.lineTo(10 * scale, 55 * scale);
      ctx.stroke();

      // Internal ventilation slots / heatsink fins
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.4)';
      ctx.lineWidth = 1.2;
      for (let f = 0; f < 5; f++) {
        const fx = (-180 + f * 24) * scale;
        ctx.beginPath();
        ctx.moveTo(fx, -5 * scale);
        ctx.lineTo(fx + 12 * scale, 20 * scale);
        ctx.stroke();
      }

      ctx.restore(); // Restore centered translation

      // 4. Draw Sockets & Connecting Vectors
      ctx.shadowBlur = 0;

      SOCKET_DEFS.forEach((s) => {
        const sx = s.rx * w;
        const sy = s.ry * h;
        const isHovered = hoveredSocketId === s.id;
        const isSelected = selectedSocketId === s.id;
        const mod = weapon.installedMods[s.id];
        const isInstalled = !!mod;

        // Socket Status Colors
        const baseColor = isInstalled ? '#00FFAA' : '#64748b';
        const activeColor = isSelected ? '#ffffff' : isHovered ? '#E07A5F' : baseColor;

        // Pulsing Reticle Ring
        const pulse = isHovered || isSelected ? Math.sin(timestamp * 0.008) * 3 + 14 : 10;

        ctx.strokeStyle = activeColor;
        ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2 : 1.2;
        ctx.beginPath();
        ctx.arc(sx, sy, pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshair reticle ticks
        ctx.beginPath();
        ctx.moveTo(sx - pulse - 4, sy);
        ctx.lineTo(sx - pulse + 2, sy);
        ctx.moveTo(sx + pulse - 2, sy);
        ctx.lineTo(sx + pulse + 4, sy);
        ctx.moveTo(sx, sy - pulse - 4);
        ctx.lineTo(sx, sy - pulse + 2);
        ctx.moveTo(sx, sy + pulse - 2);
        ctx.lineTo(sx, sy + pulse + 4);
        ctx.stroke();

        // Inner Hub Point
        ctx.fillStyle = activeColor;
        ctx.beginPath();
        ctx.arc(sx, sy, isHovered ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Tag label box
        const tagText = `[${s.label}: ${isInstalled ? mod.name : 'LEER'}]`;
        ctx.font = isHovered || isSelected ? 'bold 11px monospace' : '10px monospace';
        ctx.fillStyle = activeColor;

        const textY = sy > h * 0.5 ? sy + pulse + 14 : sy - pulse - 8;
        ctx.fillText(tagText, sx - 24, textY);
      });

      // 5. Weapon Status Watermark
      ctx.fillStyle = 'rgba(0, 255, 170, 0.6)';
      ctx.font = '10px monospace';
      ctx.fillText(`CHASSIS: ${weapon.name} // CAD v4.2 // STREAM: 60 FPS`, 14, h - 14);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [weapon, selectedSocketId, hoveredSocketId, isFoldAnimating]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerLeave={() => setHoveredSocketId(null)}
        className="w-full h-full block cursor-crosshair"
      />
      <div className="absolute top-3 left-3 text-[10px] font-mono text-cyan-500/80 bg-black/60 px-2 py-1 border border-cyan-900/60 pointer-events-none">
        [CAD-VIEWPORT // SOCKEL [1-6] ANKLICKEN]
      </div>
    </div>
  );
};

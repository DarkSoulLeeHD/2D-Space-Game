import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ISectorNode } from '../types/game';
import { ProceduralAudioEngine } from '../services/audioEngine';

interface RadarViewportProps {
  selectedSectorId: number;
  onSelectSector: (sector: ISectorNode) => void;
  dimmed?: boolean; // When settings modal is open (dims by 60%)
}

// 6 Core Sektoren von Stratum-09 wie im Diagramm spezifiziert
export const SECTOR_NODES: ISectorNode[] = [
  {
    id: 1,
    name: 'SEKTOR 01: SOLAR-ARRAYS',
    code: 'SEC-SOLAR',
    threatLevel: 1,
    status: 'STABLE',
    x: 0.22,
    y: 0.2,
    description: 'Primäre photonische Energiegewinnung. Stabilisiert bei 98% Effizienz.',
    temperature: '14°C',
    gravity: '0.12G',
    hazardNote: 'Geringe Strahlungsexposition an den Außenflügeln.',
    connections: [2, 3, 5],
  },
  {
    id: 2,
    name: 'SEKTOR 02: VERTEIDIGUNGS-BATTERIE',
    code: 'SEC-DEFENSE',
    threatLevel: 4,
    status: 'ALERT',
    x: 0.78,
    y: 0.2,
    description: 'Punktabfang-Laser und Torpedoschächte. Mehrere unautorisierte Sicherheits-Subroutinen aktiv.',
    temperature: '-4°C',
    gravity: '0.45G',
    hazardNote: 'Warnung: Autonome Abwehrgeschütze feindlich geschaltet.',
    connections: [1, 3, 4],
  },
  {
    id: 3,
    name: 'STATIONS-KERN: NULL-ZONE',
    code: 'CORE-NULL',
    threatLevel: 5,
    status: 'ANOMALY',
    x: 0.5,
    y: 0.5,
    description: 'Gravitations-Singularität und Zeitspaltungs-Epizentrum. Kausalitätsgesetze partiell suspendiert.',
    temperature: '0 K',
    gravity: '0.00G',
    hazardNote: 'Kritisch: Permanenter Entropie-Verfall. Chrono-Schutzanzug zwingend.',
    connections: [1, 2, 4, 5, 6],
  },
  {
    id: 4,
    name: 'SEKTOR 04: REAKTOR-BRUCH',
    code: 'SEC-REACTOR',
    threatLevel: 4,
    status: 'COLLAPSED',
    x: 0.84,
    y: 0.52,
    description: 'Magnet-Eindämmung kollabiert. Schwere temporale Dekompression und Kühlmittelverlust.',
    temperature: '480°C',
    gravity: '0.05G',
    hazardNote: 'Dekomprimiert: Vakuum-Bruch und akute Kernschmelze.',
    connections: [2, 3, 6],
  },
  {
    id: 5,
    name: 'SEKTOR 05: HANGAR-BASIS',
    code: 'SEC-HANGAR',
    threatLevel: 1,
    status: 'STABLE',
    x: 0.22,
    y: 0.8,
    description: 'Operative-Basis, Waffenwerkbank und Bergungsshuttle. Letzter sicherer Zufluchtsort.',
    temperature: '-12°C',
    gravity: '0.38G',
    hazardNote: 'Sicherer Quadrant: Schilde und Lebenserhaltung aktiv.',
    connections: [1, 3, 6],
  },
  {
    id: 6,
    name: 'SEKTOR 06: DATEN-SPEICHER',
    code: 'SEC-STORAGE',
    threatLevel: 3,
    status: 'ALERT',
    x: 0.78,
    y: 0.8,
    description: 'Kryo-Datenbänke und Archiv-Kerne. Mutierte Kriecher-Biome in den Belüftungskanälen.',
    temperature: '-50°C',
    gravity: '0.35G',
    hazardNote: 'Feindkontakt: Schwarm-Signaturen detektiert.',
    connections: [3, 4, 5],
  },
];

interface IParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  life: number;
}

export const RadarViewport: React.FC<RadarViewportProps> = ({
  selectedSectorId,
  onSelectSector,
  dimmed = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);
  const particlesRef = useRef<IParticle[]>([]);
  const lastHoverSoundRef = useRef<number | null>(null);

  // Trigger hover sound with throttle
  const triggerHoverSound = useCallback((nodeId: number) => {
    if (lastHoverSoundRef.current !== nodeId) {
      lastHoverSoundRef.current = nodeId;
      ProceduralAudioEngine.getInstance().playHoverPing();
    }
  }, []);

  // Mouse move handler for Euclidean Hit-Testing
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let foundNode: ISectorNode | null = null;
    const baseHitRadius = 26;

    for (const node of SECTOR_NODES) {
      const nodeX = node.x * canvas.width;
      const nodeY = node.y * canvas.height;
      const dist = Math.hypot(mouseX - nodeX, mouseY - nodeY);

      if (dist < baseHitRadius) {
        foundNode = node;
        break;
      }
    }

    if (foundNode) {
      setHoveredNodeId(foundNode.id);
      triggerHoverSound(foundNode.id);

      // Emit interference particles upon hover
      for (let i = 0; i < 3; i++) {
        particlesRef.current.push({
          x: foundNode.x * canvas.width,
          y: foundNode.y * canvas.height,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          alpha: 0.9,
          color: foundNode.status === 'ANOMALY' ? '#E07A5F' : foundNode.status === 'ALERT' ? '#FFB703' : '#00FFAA',
          size: Math.random() * 2 + 1,
          life: 0.6,
        });
      }
    } else {
      setHoveredNodeId(null);
      lastHoverSoundRef.current = null;
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (const node of SECTOR_NODES) {
      const nodeX = node.x * canvas.width;
      const nodeY = node.y * canvas.height;
      const dist = Math.hypot(mouseX - nodeX, mouseY - nodeY);

      if (dist < 30) {
        ProceduralAudioEngine.getInstance().playSelectClick();
        onSelectSector(node);
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

    let sweepAngle = 0;

    const render = (timestamp: number) => {
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const maxRadius = Math.min(width, height) * 0.44;

      // 1. Phosphor Persistence background
      ctx.fillStyle = 'rgba(7, 10, 14, 0.22)';
      ctx.fillRect(0, 0, width, height);

      // 2. Radar Distance Range Rings
      ctx.lineWidth = 1;
      [0.25, 0.5, 0.75, 1.0].forEach((ratio) => {
        ctx.strokeStyle = 'rgba(0, 255, 170, 0.08)';
        ctx.beginPath();
        ctx.arc(cx, cy, maxRadius * ratio, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshairs
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.06)';
      ctx.beginPath();
      ctx.moveTo(cx, cy - maxRadius);
      ctx.lineTo(cx, cy + maxRadius);
      ctx.moveTo(cx - maxRadius, cy);
      ctx.lineTo(cx + maxRadius, cy);
      ctx.stroke();

      // 3. Radar Sweep Line (continuous rotation)
      sweepAngle = (timestamp * 0.001) % (Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepAngle) * maxRadius, cy + Math.sin(sweepAngle) * maxRadius);
      ctx.stroke();

      // 4. Sector Connection Links
      SECTOR_NODES.forEach((node) => {
        const nx = node.x * width;
        const ny = node.y * height;

        node.connections.forEach((connId) => {
          if (connId <= node.id) return; // avoid duplicate lines
          const target = SECTOR_NODES.find((s) => s.id === connId);
          if (!target) return;
          const tx = target.x * width;
          const ty = target.y * height;

          const isFlickering = hoveredNodeId === node.id || hoveredNodeId === target.id;
          const flickerAlpha = isFlickering ? (Math.random() > 0.3 ? 0.75 : 0.2) : 0.15;

          ctx.strokeStyle = isFlickering ? `rgba(0, 255, 170, ${flickerAlpha})` : 'rgba(0, 255, 170, 0.12)';
          ctx.lineWidth = isFlickering ? 2 : 1;
          ctx.setLineDash(isFlickering ? [4, 4] : []);
          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(tx, ty);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      });

      // 5. Gravitations-Wellen vom Stations-Kern (Null-Zone)
      const coreNode = SECTOR_NODES.find((s) => s.id === 3);
      if (coreNode) {
        const coreX = coreNode.x * width;
        const coreY = coreNode.y * height;
        const waveCount = 3;
        for (let w = 0; w < waveCount; w++) {
          const wavePhase = ((timestamp * 0.0012 + (w / waveCount)) % 1);
          const waveRadius = 12 + wavePhase * 60;
          const waveAlpha = (1 - wavePhase) * 0.4;
          ctx.strokeStyle = `rgba(224, 122, 95, ${waveAlpha})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(coreX, coreY, waveRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 6. Particle Updates & Draw
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;
        p.life -= 0.02;

        if (p.alpha <= 0 || p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // 7. Sector Nodes Rendering
      SECTOR_NODES.forEach((node) => {
        const nx = node.x * width;
        const ny = node.y * height;
        const isHovered = hoveredNodeId === node.id;
        const isSelected = selectedSectorId === node.id;
        const isPlayerBase = node.id === 5; // Hangar 05

        // Status Colors: Cyan (Stable), Amber (Alert), Red/Rust (Collapsed/Anomaly)
        let nodeColor = '#00FFAA';
        if (node.status === 'ALERT') nodeColor = '#FFB703';
        if (node.status === 'COLLAPSED' || node.status === 'ANOMALY') nodeColor = '#E07A5F';

        // Elastic Pulsing scale when hovered (scale 1.3x)
        const pulse = isHovered ? Math.sin(timestamp * 0.01) * 3 + 18 : isSelected ? 15 : 12;

        // Outer Glow Ring
        ctx.shadowColor = nodeColor;
        ctx.shadowBlur = isHovered ? 18 : isSelected ? 12 : 6;
        ctx.strokeStyle = nodeColor;
        ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2 : 1.2;

        ctx.beginPath();
        ctx.arc(nx, ny, pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Inner solid core
        ctx.fillStyle = isHovered ? nodeColor : isSelected ? '#ffffff' : `${nodeColor}44`;
        ctx.beginPath();
        ctx.arc(nx, ny, isHovered ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0; // reset

        // Player Beacon Indicator at Hangar
        if (isPlayerBase) {
          ctx.strokeStyle = '#00FFAA';
          ctx.lineWidth = 1;
          const beaconSize = pulse + 8;
          ctx.strokeRect(nx - beaconSize / 2, ny - beaconSize / 2, beaconSize, beaconSize);

          ctx.fillStyle = '#00FFAA';
          ctx.font = '9px monospace';
          ctx.fillText('[BASIS: VANCE]', nx - 36, ny - pulse - 8);
        }

        // Sector Node Label
        ctx.fillStyle = isSelected ? '#ffffff' : isHovered ? nodeColor : 'rgba(216, 226, 220, 0.8)';
        ctx.font = isHovered || isSelected ? 'bold 11px monospace' : '10px monospace';
        const labelY = ny > cy ? ny + pulse + 14 : ny - pulse - 6;
        ctx.fillText(node.code, nx - 22, labelY);
      });

      // 8. Corner Coordinate Watermarks
      ctx.fillStyle = 'rgba(0, 255, 170, 0.4)';
      ctx.font = '9px monospace';
      ctx.fillText('TACTICAL RADAR // STRATUM-09 // RANGE: 1.200km', 14, height - 14);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [selectedSectorId, hoveredNodeId]);

  return (
    <div
      className={`relative w-full h-full transition-opacity duration-300 ${
        dimmed ? 'opacity-40' : 'opacity-100'
      }`}
    >
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerLeave={() => setHoveredNodeId(null)}
        className="w-full h-full cursor-crosshair block"
      />
      {/* Sub-label in corner */}
      <div className="absolute top-3 left-3 pointer-events-none text-[10px] font-mono text-cyan-300 font-bold bg-black/70 px-2 py-1 border border-cyan-700/80">
        [RADAR: INTERAKTIV // KNOTEN ANWÄHLEN]
      </div>
    </div>
  );
};

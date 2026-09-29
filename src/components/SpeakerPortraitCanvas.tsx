// components/SpeakerPortraitCanvas.tsx - Prozedurales Vektor- & ASCII-Gesicht mit Lippen-Synchronisation

import React, { useEffect, useRef } from 'react';
import { FactionId } from '../types/narrative';

interface SpeakerPortraitCanvasProps {
  isSpeaking: boolean;
  glitchIntensity: number; // 0.0 bis 1.0
  themeColor?: string;
  faction?: FactionId;
  isCollapsing?: boolean;
}

export const SpeakerPortraitCanvas: React.FC<SpeakerPortraitCanvasProps> = ({
  isSpeaking,
  glitchIntensity,
  themeColor = '#00FFAA',
  faction = 'ASTRAEA',
  isCollapsing = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = (canvas.width = canvas.parentElement?.clientWidth || 360);
      const h = (canvas.height = canvas.parentElement?.clientHeight || 420);

      ctx.clearRect(0, 0, w, h);

      // Deep dark monitor background
      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2 - 10;
      const time = performance.now();

      // Glitch-Verschiebung
      const glitchX = (Math.random() - 0.5) * glitchIntensity * 14;
      const glitchY = (Math.random() - 0.5) * glitchIntensity * 8;

      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = themeColor;
      ctx.shadowBlur = 10;

      // 1. Fraktions-spezifische Schädel-Kontur
      ctx.beginPath();
      if (faction === 'ASTRAEA') {
        // Schnittige, symmetrische Kybernetik-Schale
        ctx.moveTo(cx - 75 + glitchX, cy - 95 + glitchY);
        ctx.lineTo(cx + 75 + glitchX, cy - 95 + glitchY);
        ctx.lineTo(cx + 95 + glitchX, cy + 30 + glitchY);
        ctx.lineTo(cx + 45 + glitchX, cy + 95 + glitchY);
        ctx.lineTo(cx - 45 + glitchX, cy + 95 + glitchY);
        ctx.lineTo(cx - 95 + glitchX, cy + 30 + glitchY);
        ctx.closePath();
      } else if (faction === 'GUILD') {
        // Robuste Industrie-Schutzmaske mit Nieten
        ctx.moveTo(cx - 85 + glitchX, cy - 80 + glitchY);
        ctx.lineTo(cx + 85 + glitchX, cy - 80 + glitchY);
        ctx.lineTo(cx + 100 + glitchX, cy + 20 + glitchY);
        ctx.lineTo(cx + 60 + glitchX, cy + 105 + glitchY);
        ctx.lineTo(cx - 60 + glitchX, cy + 105 + glitchY);
        ctx.lineTo(cx - 100 + glitchX, cy + 20 + glitchY);
        ctx.closePath();
      } else {
        // Resonanz-Ketzer: Fraktale Spitzen & Äther-Kranz
        ctx.moveTo(cx - 60 + glitchX, cy - 115 + glitchY);
        ctx.lineTo(cx + glitchX, cy - 135 + glitchY);
        ctx.lineTo(cx + 60 + glitchX, cy - 115 + glitchY);
        ctx.lineTo(cx + 85 + glitchX, cy + 35 + glitchY);
        ctx.lineTo(cx + 35 + glitchX, cy + 100 + glitchY);
        ctx.lineTo(cx - 35 + glitchX, cy + 100 + glitchY);
        ctx.lineTo(cx - 85 + glitchX, cy + 35 + glitchY);
        ctx.closePath();
      }
      ctx.stroke();

      // 2. Stirn- & Schläfen-Linien
      ctx.beginPath();
      ctx.moveTo(cx - 60 + glitchX, cy - 55 + glitchY);
      ctx.lineTo(cx + 60 + glitchX, cy - 55 + glitchY);
      ctx.stroke();

      // 3. Optische Sensoren / Augen (Rechteckige Vektor-Optik)
      const blink = Math.sin(time * 0.003) > 0.98;
      const eyeH = blink ? 2 : 14;

      // Linkes Auge
      ctx.strokeRect(cx - 52 + glitchX, cy - 30 + (blink ? 6 : 0) + glitchY, 28, eyeH);
      ctx.fillStyle = themeColor;
      ctx.fillRect(cx - 44 + glitchX, cy - 26 + (blink ? 6 : 0) + glitchY, 12, Math.max(1, eyeH - 8));

      // Rechtes Auge
      ctx.strokeRect(cx + 24 + glitchX, cy - 30 + (blink ? 6 : 0) + glitchY, 28, eyeH);
      ctx.fillRect(cx + 32 + glitchX, cy - 26 + (blink ? 6 : 0) + glitchY, 12, Math.max(1, eyeH - 8));

      // 4. Nasen-Kiel & Vektor-Drahtgitter
      ctx.beginPath();
      ctx.moveTo(cx + glitchX, cy - 25 + glitchY);
      ctx.lineTo(cx - 8 + glitchX, cy + 15 + glitchY);
      ctx.lineTo(cx + 8 + glitchX, cy + 15 + glitchY);
      ctx.stroke();

      // 5. Prozedurales Lippen- & Kiefer-Movement
      // Wenn Sprechen aktiv: Oszillation synchronisiert zur Teletype-Frequenz
      const mouthOpen = isSpeaking
        ? Math.max(4, Math.sin(time * 0.024) * 16 + 18)
        : 4;

      ctx.beginPath();
      ctx.rect(cx - 32 + glitchX, cy + 42 + glitchY, 64, mouthOpen);
      ctx.fillStyle = themeColor;
      ctx.globalAlpha = 0.22;
      ctx.fill();
      ctx.globalAlpha = 1.0;
      ctx.stroke();

      // Zahn-Raster / Audio-Spektrum im Mund
      if (isSpeaking && mouthOpen > 8) {
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 1;
        for (let bx = -24; bx <= 24; bx += 8) {
          ctx.beginPath();
          ctx.moveTo(cx + bx + glitchX, cy + 42 + glitchY);
          ctx.lineTo(cx + bx + glitchX, cy + 42 + mouthOpen + glitchY);
          ctx.stroke();
        }
      }

      // 6. Audio-Wellenleiter unterhalb des Kinns
      const waveY = cy + 130 + glitchY;
      ctx.beginPath();
      ctx.moveTo(cx - 90, waveY);
      for (let x = -90; x <= 90; x += 10) {
        const wave = isSpeaking ? Math.sin((time * 0.01) + x * 0.1) * 8 : 0;
        ctx.lineTo(cx + x, waveY + wave);
      }
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.4)';
      ctx.stroke();

      // 7. Raster- & Scanline-Overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 2);
      }

      // 8. Technische Gitter-Koordinaten
      ctx.fillStyle = 'rgba(0, 255, 170, 0.5)';
      ctx.font = '8px monospace';
      ctx.fillText(`NEURAL-LINK: ${isSpeaking ? 'VOX-STREAM' : 'STANDBY'}`, 14, 20);
      ctx.fillText(`ENTROPIE: ${(glitchIntensity * 100).toFixed(0)}%`, w - 85, 20);
      ctx.fillText(`SIG-CODE: [${faction}]`, 14, h - 14);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isSpeaking, glitchIntensity, themeColor, faction]);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center overflow-hidden border border-cyan-900/60 bg-[#06080d] transition-transform duration-200 ${
        isCollapsing ? 'scale-y-0 opacity-0' : 'scale-y-100 opacity-100'
      }`}
    >
      <canvas ref={canvasRef} className="w-full h-full max-w-[420px] max-h-[500px]" />
    </div>
  );
};

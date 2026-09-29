import React, { useEffect, useRef, useState } from 'react';

interface AttractCanvasProps {
  reducedMotion: boolean;
  isTransitioning: boolean;
  onCanvasError?: () => void;
}

export const AttractCanvas: React.FC<AttractCanvasProps> = ({
  reducedMotion,
  isTransitioning,
  onCanvasError,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setHasError(true);
      onCanvasError?.();
      return;
    }

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
      // Clear once to reset
      ctx.fillStyle = '#070a0e';
      ctx.fillRect(0, 0, width, height);
    };

    window.addEventListener('resize', handleResize);

    // Initial background fill
    ctx.fillStyle = '#070a0e';
    ctx.fillRect(0, 0, width, height);

    // Generate static star points
    const stars: { x: number; y: number; size: number; alpha: number; speed: number }[] = [];
    const starCount = 80;
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.002 + 0.001,
      });
    }

    const render = (timestamp: number) => {
      // 1. Phosphor Persistence Shader: Fill with semi-transparent dark tone for glow trails
      ctx.fillStyle = 'rgba(7, 10, 14, 0.18)';
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // 2. Stars rendering
      stars.forEach((star) => {
        const twinkle = Math.sin(timestamp * star.speed) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(180, 240, 220, ${star.alpha * twinkle * 0.6})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });

      // 3. Grid coordinates & Radar grid markings (subtle)
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Outer radar circle
      ctx.arc(centerX, centerY, Math.min(width, height) * 0.38, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshair lines
      ctx.beginPath();
      ctx.moveTo(centerX - 40, centerY);
      ctx.lineTo(centerX + 40, centerY);
      ctx.moveTo(centerX, centerY - 40);
      ctx.lineTo(centerX, centerY + 40);
      ctx.stroke();

      // 4. Mathematical Orbit Projection for Stratum-09 Space Station
      // Angular velocity: 0.04 rad/s (fixed if reduced-motion)
      const angle = reducedMotion ? 0.3 : timestamp * 0.0004;

      // Dynamic responsive radii
      const baseRadius = Math.min(width * 0.35, 240);
      const radiusX = baseRadius;
      const radiusY = baseRadius * 0.35; // 3D perspective pitch tilt

      // Glow setting
      ctx.shadowColor = '#00FFAA';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#00FFAA';
      ctx.lineWidth = 1.6;

      // 4a. Outer Torus Ring (36 Segments)
      const segments = 36;
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2 + angle;
        const x = centerX + Math.cos(theta) * radiusX;
        const y = centerY + Math.sin(theta) * radiusY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 4b. Secondary Inner Orbit Ring
      const innerRadiusX = radiusX * 0.65;
      const innerRadiusY = radiusY * 0.65;
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2 + angle;
        const x = centerX + Math.cos(theta) * innerRadiusX;
        const y = centerY + Math.sin(theta) * innerRadiusY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.6)';
      ctx.stroke();

      // 4c. Structural Spokes (6 radial arms connecting torus to hub)
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.45)';
      ctx.lineWidth = 1.2;
      for (let s = 0; s < 6; s++) {
        const spokeTheta = (s / 6) * Math.PI * 2 + angle;
        const outerX = centerX + Math.cos(spokeTheta) * radiusX;
        const outerY = centerY + Math.sin(spokeTheta) * radiusY;
        const innerX = centerX + Math.cos(spokeTheta) * (radiusX * 0.22);
        const innerY = centerY + Math.sin(spokeTheta) * (radiusY * 0.22);

        ctx.beginPath();
        ctx.moveTo(innerX, innerY);
        ctx.lineTo(outerX, outerY);
        ctx.stroke();

        // Node dots along the spokes
        ctx.fillStyle = '#00FFAA';
        ctx.beginPath();
        ctx.arc(outerX, outerY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4d. Central Singular Core (0.0G Singular Hub)
      const corePulse = Math.sin(timestamp * 0.003) * 3 + 12;
      ctx.strokeStyle = '#00FFAA';
      ctx.fillStyle = 'rgba(0, 255, 170, 0.15)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, corePulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Core singularity ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, corePulse * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#00FFAA';
      ctx.fill();

      // 4e. Exterior Solar Arrays / Heat Radiator Fins
      const finAngle = angle + Math.PI / 4;
      for (let f = 0; f < 2; f++) {
        const finTheta = finAngle + f * Math.PI;
        const p1x = centerX + Math.cos(finTheta) * radiusX;
        const p1y = centerY + Math.sin(finTheta) * radiusY;
        const p2x = centerX + Math.cos(finTheta) * (radiusX + 50);
        const p2y = centerY + Math.sin(finTheta) * (radiusY + 15);

        ctx.strokeStyle = 'rgba(0, 255, 170, 0.7)';
        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.stroke();

        // Array wing grid
        ctx.fillStyle = 'rgba(0, 255, 170, 0.2)';
        ctx.fillRect(p2x - 8, p2y - 4, 16, 8);
      }

      // Reset shadow blur
      ctx.shadowBlur = 0;

      // 4f. Vector Telemetry labels
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(0, 255, 170, 0.75)';
      ctx.fillText('[KERN: 0.0G SINGULAR]', centerX - 58, centerY + radiusY + 28);
      ctx.fillText('ROTATION: 0.04 RAD/S // STRATUM-09', centerX - 95, centerY - radiusY - 20);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [reducedMotion, onCanvasError]);

  if (hasError) {
    // Fallback ASCII Wireframe if HTML5 Canvas fails
    return (
      <div className="w-full h-full flex flex-col items-center justify-center font-mono text-cyan-400 text-xs select-none">
        <pre className="text-cyan-400/80 leading-tight">
{`          .  *        .             *          .
       ┌───────────────────────────┐
      /    /─────────────────\\    \\
     │    │   [KERN: 0.0G]    │    │
      \\    \\  (SINGULARITY)  /    /
       └────\\─────────────────/────┘
          *       STRATUM-09       .`}
        </pre>
        <span className="mt-4 text-amber-400/80">[Vektor-Render Fallback Aktiv // Canvas 2D Emuliert]</span>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full transition-transform duration-500 ease-out ${
        isTransitioning ? 'scale-[2.4] opacity-0' : 'scale-100 opacity-100'
      }`}
    />
  );
};

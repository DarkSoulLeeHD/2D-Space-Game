import React, { useEffect, useRef } from 'react';
import { ProceduralAudioEngine } from '../services/audioEngine';
import { THEME_COLORS, PhosphorTheme } from '../types/settings';

interface AudioSpectrumCanvasProps {
  colorTheme: PhosphorTheme;
}

export const AudioSpectrumCanvas: React.FC<AudioSpectrumCanvasProps> = ({ colorTheme }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const audio = ProceduralAudioEngine.getInstance();
    const analyser = audio.analyser;

    const bufferLength = analyser ? analyser.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const theme = THEME_COLORS[colorTheme] || THEME_COLORS.CYAN;

    const render = (timestamp: number) => {
      const width = canvas.width;
      const height = canvas.height;

      // Dark background with slight trace persistence
      ctx.fillStyle = 'rgba(7, 10, 14, 0.35)';
      ctx.fillRect(0, 0, width, height);

      // Oscilloscope background grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const stepX = width / 8;
      const stepY = height / 4;

      ctx.beginPath();
      for (let x = 0; x < width; x += stepX) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += stepY) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Center zero-crossing line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Read Web Audio Frequency Data
      let isSilent = true;
      if (analyser && audio.isUnlocked) {
        analyser.getByteTimeDomainData(dataArray);
        // Check if there is actual audio playing
        for (let i = 0; i < bufferLength; i++) {
          if (Math.abs(dataArray[i] - 128) > 2) {
            isSilent = false;
            break;
          }
        }
      }

      // Draw Waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = theme.primary;
      ctx.shadowColor = theme.primary;
      ctx.shadowBlur = 8;
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        let v: number;
        if (isSilent) {
          // Idle wave simulation when no audio is currently sounding
          v = Math.sin(timestamp * 0.003 + i * 0.1) * 0.1 + 0.5;
        } else {
          v = dataArray[i] / 256.0;
        }

        const y = v * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // Oscilloscope labels
      ctx.fillStyle = theme.primary;
      ctx.font = '9px monospace';
      ctx.fillText(isSilent ? 'STANDBY // IDLE' : 'DSP BUS // 48.000 Hz', 8, 14);
      ctx.fillText('OSZILLOSKOP-SPEKTRUM', width - 110, height - 6);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [colorTheme]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block cursor-default"
    />
  );
};

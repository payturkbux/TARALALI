import React, { useEffect, useRef } from 'react';
import { gameEngine } from '../game/GameEngine';
import { COUNTRIES_DATA, ARENA_CONFIG } from '../data/countries';
import { CountryId } from '../types';

interface RadarMapProps {
  playerCountryId: CountryId;
}

export const RadarMap: React.FC<RadarMapProps> = ({ playerCountryId }) => {
  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;

    const drawRadar = () => {
      const canvas = radarCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = canvas.width;
      const center = size / 2;
      const scale = (size * 0.44) / (ARENA_CONFIG.WORLD_SIZE / 2);

      // Clear radar
      ctx.clearRect(0, 0, size, size);

      // Background radar circle
      ctx.fillStyle = 'rgba(6, 11, 25, 0.82)';
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(center, center, size * 0.46, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Radar Concentric rings
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(center, center, size * 0.25, 0, Math.PI * 2);
      ctx.arc(center, center, size * 0.38, 0, Math.PI * 2);
      ctx.stroke();

      // Center crosshair
      ctx.beginPath();
      ctx.moveTo(center, 4);
      ctx.lineTo(center, size - 4);
      ctx.moveTo(4, center);
      ctx.lineTo(size - 4, center);
      ctx.stroke();

      // Draw the 20 National Vaults
      const worldCenter = ARENA_CONFIG.WORLD_SIZE / 2;
      gameEngine.vaults.forEach(vault => {
        const country = COUNTRIES_DATA[vault.countryId];
        if (!country) return;

        const rx = center + (vault.x - worldCenter) * scale;
        const ry = center + (vault.y - worldCenter) * scale;

        // Vault dot
        ctx.fillStyle = country.glowColor;
        ctx.beginPath();
        ctx.arc(rx, ry, vault.countryId === playerCountryId ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fill();

        // Tower Charge Indicator
        if (vault.tower.charge >= 95) {
          ctx.strokeStyle = '#ff3838';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(rx, ry, 6, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Active Laser Beams on Radar
      gameEngine.laserBeams.forEach(beam => {
        const fromRx = center + (beam.fromX - worldCenter) * scale;
        const fromRy = center + (beam.fromY - worldCenter) * scale;
        const toRx = center + (beam.toX - worldCenter) * scale;
        const toRy = center + (beam.toY - worldCenter) * scale;

        ctx.strokeStyle = '#ff3838';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fromRx, fromRy);
        ctx.lineTo(toRx, toRy);
        ctx.stroke();
      });

      // Player Location Marker (Pulsing bright white/cyan diamond)
      const px = center + (gameEngine.cameraX - worldCenter) * scale;
      const py = center + (gameEngine.cameraY - worldCenter) * scale;

      const playerPulse = (Math.sin(Date.now() * 0.008) + 1) * 2;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px, py, 4 + playerPulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(drawRadar);
    };

    animId = requestAnimationFrame(drawRadar);
    return () => cancelAnimationFrame(animId);
  }, [playerCountryId]);

  return (
    <div id="radar-minimap-container" className="relative p-2 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 shadow-lg shadow-cyan-950/40">
      <div className="flex items-center justify-between px-1 mb-1 text-[11px] font-bold text-cyan-400">
        <span>رادار الساحة الوطنية</span>
        <span className="text-[10px] text-slate-400">20 مخزناً</span>
      </div>
      <canvas
        id="radar-canvas"
        ref={radarCanvasRef}
        width={140}
        height={140}
        className="w-[140px] h-[140px] rounded-xl block"
      />
    </div>
  );
};

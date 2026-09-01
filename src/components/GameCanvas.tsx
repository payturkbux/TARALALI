import React, { useEffect, useRef } from 'react';
import { gameEngine } from '../game/GameEngine';

interface GameCanvasProps {
  onPointerMove?: (screenX: number, screenY: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ onPointerMove }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    gameEngine.setCanvas(canvas);
    gameEngine.start();

    const handleResize = () => {
      gameEngine.resizeCanvas();
    };

    window.addEventListener('resize', handleResize);

    const updateWorldMouse = (clientX: number, clientY: number) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;

      gameEngine.mouseScreenX = screenX;
      gameEngine.mouseScreenY = screenY;

      // Transform screen coordinates to world coordinates
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const centerX = (canvas.width / dpr) / 2;
      const centerY = (canvas.height / dpr) / 2;

      const worldX = gameEngine.cameraX + (screenX - centerX) / gameEngine.cameraZoom;
      const worldY = gameEngine.cameraY + (screenY - centerY) / gameEngine.cameraZoom;

      gameEngine.mouseWorldX = worldX;
      gameEngine.mouseWorldY = worldY;

      if (onPointerMove) {
        onPointerMove(screenX, screenY);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      updateWorldMouse(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        updateWorldMouse(touch.clientX, touch.clientY);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        updateWorldMouse(touch.clientX, touch.clientY);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        gameEngine.splitPlayer();
      } else if (e.code === 'KeyW') {
        e.preventDefault();
        gameEngine.ejectMass();
      } else if (e.shiftKey) {
        gameEngine.setPlayerBoost(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.shiftKey) {
        gameEngine.setPlayerBoost(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      gameEngine.stop();
    };
  }, [onPointerMove]);

  return (
    <canvas
      id="game-viewport-canvas"
      ref={canvasRef}
      className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
    />
  );
};

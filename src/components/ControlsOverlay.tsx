import React from 'react';
import { Scissors, Flame, ArrowUpCircle } from 'lucide-react';
import { gameEngine } from '../game/GameEngine';

interface ControlsOverlayProps {
  onQuickDeposit: () => void;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({ onQuickDeposit }) => {
  const handleSplit = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    gameEngine.splitPlayer();
  };

  const handleEject = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    gameEngine.ejectMass();
  };

  const handleBoostStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    gameEngine.setPlayerBoost(true);
  };

  const handleBoostEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    gameEngine.setPlayerBoost(false);
  };

  return (
    <div id="touch-controls-container" className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
      {/* Split Button */}
      <button
        id="btn-split-action"
        onClick={handleSplit}
        onTouchStart={handleSplit}
        className="pointer-events-auto w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-cyan-600/30 hover:bg-cyan-500/40 active:scale-90 border border-cyan-400/50 backdrop-blur-md text-cyan-300 hover:text-white flex flex-col items-center justify-center gap-0.5 shadow-xl shadow-cyan-950/50 transition-transform cursor-pointer"
        title="انقسام الكرة التكتيكي (Space)"
      >
        <Scissors className="w-5 h-5 md:w-6 md:h-6" />
        <span className="text-[10px] font-black tracking-wider">انقسام [مسافة]</span>
      </button>

      {/* Turbo Boost Button */}
      <button
        id="btn-boost-action"
        onMouseDown={handleBoostStart}
        onMouseUp={handleBoostEnd}
        onMouseLeave={handleBoostEnd}
        onTouchStart={handleBoostStart}
        onTouchEnd={handleBoostEnd}
        className="pointer-events-auto w-16 h-16 md:w-18 md:h-18 rounded-3xl bg-gradient-to-tr from-amber-600/40 to-red-600/40 hover:from-amber-500/50 hover:to-red-500/50 active:scale-95 border-2 border-amber-400/70 backdrop-blur-md text-amber-300 hover:text-white flex flex-col items-center justify-center gap-0.5 shadow-2xl shadow-red-950/60 transition-transform cursor-pointer"
        title="تسارع تيربو (Shift)"
      >
        <Flame className="w-6 h-6 md:w-7 md:h-7 animate-pulse text-amber-400" />
        <span className="text-[11px] font-black tracking-wider text-amber-300">تيربو [Shift]</span>
      </button>

      {/* Eject Pellet Button */}
      <button
        id="btn-eject-action"
        onClick={handleEject}
        onTouchStart={handleEject}
        className="pointer-events-auto w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-emerald-600/30 hover:bg-emerald-500/40 active:scale-90 border border-emerald-400/50 backdrop-blur-md text-emerald-300 hover:text-white flex flex-col items-center justify-center gap-0.5 shadow-xl shadow-emerald-950/50 transition-transform cursor-pointer"
        title="إطلاق كبسولة طاقة لتغذية الحلفاء أو شحن البرج (W)"
      >
        <ArrowUpCircle className="w-5 h-5 md:w-6 md:h-6" />
        <span className="text-[10px] font-black tracking-wider">إطلاق [W]</span>
      </button>
    </div>
  );
};

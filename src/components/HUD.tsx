import React from 'react';
import { Shield, Zap, Wallet, Trophy, Globe, Volume2, VolumeX, Sparkles, ArrowUpCircle } from 'lucide-react';
import { CountryId } from '../types';
import { COUNTRIES_DATA } from '../data/countries';
import { RadarMap } from './RadarMap';
import { soundManager } from '../services/sound';

interface HUDProps {
  playerCountryId: CountryId;
  playerName: string;
  mass: number;
  rank: number;
  kills: number;
  vaultEnergy: number;
  towerCharge: number;
  walletBalance: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenWallet: () => void;
  onOpenLeaderboard: () => void;
  onOpenCountrySelect: () => void;
  onQuickDeposit: () => void;
  onQuickCharge: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  playerCountryId,
  playerName,
  mass,
  rank,
  kills,
  vaultEnergy,
  towerCharge,
  walletBalance,
  isMuted,
  onToggleMute,
  onOpenWallet,
  onOpenLeaderboard,
  onOpenCountrySelect,
  onQuickDeposit,
  onQuickCharge,
}) => {
  const country = COUNTRIES_DATA[playerCountryId] || COUNTRIES_DATA.KSA;
  const isTowerReady = towerCharge >= 100;

  return (
    <div id="game-hud-layer" className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 md:p-6 select-none z-10">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between gap-3">
        {/* Player & Country Badge */}
        <div className="pointer-events-auto flex items-center gap-3 p-2.5 md:p-3 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 shadow-xl">
          <button
            id="hud-country-button"
            onClick={onOpenCountrySelect}
            className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 transition-all border border-slate-600/40 text-right group cursor-pointer"
            title="تغيير الدولة أو عرض الخصائص"
          >
            <span className="text-2xl md:text-3xl leading-none">{country.flag}</span>
            <div className="hidden sm:block">
              <div className="text-[10px] text-slate-400 font-medium">{country.code}</div>
              <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                {country.nameAr}
              </div>
            </div>
          </button>

          <div className="h-8 w-px bg-slate-700/80" />

          {/* Mass & Rank Metric */}
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10px] text-slate-400 font-semibold">طاقة الكتلة</div>
              <div className="text-lg md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                {mass.toLocaleString()}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 font-semibold">الترتيب</div>
              <div className="text-lg md:text-2xl font-black text-amber-400 flex items-center gap-1">
                <span>#{rank}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Right: Wallet & Sound Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Sovereign Wallet Quick Pill */}
          <button
            id="hud-wallet-button"
            onClick={onOpenWallet}
            className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 border border-amber-500/40 backdrop-blur-md shadow-lg shadow-amber-950/30 transition-all cursor-pointer group"
          >
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
            <div className="text-right">
              <div className="text-[10px] font-semibold text-amber-300/80">المحفظة السيادية</div>
              <div className="text-xs md:text-sm font-extrabold text-white flex items-center gap-1">
                <span>{walletBalance.toLocaleString()}</span>
                <span className="text-[10px] text-amber-400 font-normal">EN</span>
              </div>
            </div>
          </button>

          {/* Leaderboard Button */}
          <button
            id="hud-leaderboard-button"
            onClick={onOpenLeaderboard}
            className="p-2.5 md:p-3 rounded-2xl bg-slate-900/85 hover:bg-slate-800 text-cyan-400 border border-slate-700/60 backdrop-blur-md transition-all cursor-pointer shadow-lg"
            title="قائمة الشرف والسيادة الوطنية"
          >
            <Trophy className="w-5 h-5" />
          </button>

          {/* Sound Toggle */}
          <button
            id="hud-sound-button"
            onClick={onToggleMute}
            className="p-2.5 md:p-3 rounded-2xl bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md transition-all cursor-pointer shadow-lg"
            title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Middle Center: Defense Tower Laser Status Banner */}
      <div className="flex justify-between items-end gap-3">
        {/* Left Side: Radar Minimap */}
        <div className="pointer-events-auto">
          <RadarMap playerCountryId={playerCountryId} />
        </div>

        {/* Right Side: National Defense Tower Status */}
        <div className="pointer-events-auto flex flex-col gap-2 max-w-xs">
          {/* National Defense Tower Status Box */}
          <div className="p-3 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/70 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <Shield className={`w-4 h-4 ${isTowerReady ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`} />
                <span>برج حماية {country.nameAr}</span>
              </div>
              <span className={`text-xs font-black ${isTowerReady ? 'text-red-400 animate-bounce' : 'text-cyan-400'}`}>
                {isTowerReady ? 'جاهز للإطلاق ⚡' : `${Math.round(towerCharge)}%`}
              </span>
            </div>

            {/* Laser Charge Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isTowerReady
                    ? 'bg-gradient-to-r from-red-500 via-orange-400 to-amber-300 animate-pulse'
                    : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                }`}
                style={{ width: `${Math.min(100, towerCharge)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
              <span>يشحن آلياً وبتواجد الحلفاء</span>
              <span>مدى: 850م</span>
            </div>
          </div>

          {/* Quick Wallet Actions in Field */}
          <div className="flex gap-2">
            <button
              id="hud-quick-deposit-button"
              onClick={onQuickDeposit}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
              title="تفريغ طاقة الكرة وتخزينها في المحفظة السيادية"
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              <span>تخزين بالمحفظة</span>
            </button>

            <button
              id="hud-quick-charge-button"
              onClick={onQuickCharge}
              className="flex-1 py-2 px-3 rounded-xl bg-cyan-600/25 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
              title="شحن الكرة بـ 50 نقطة من رصيد المحفظة"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>شحن +50</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

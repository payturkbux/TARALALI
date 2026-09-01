import React, { useState } from 'react';
import { RotateCcw, Wallet, Trophy, Shield, Zap, Sparkles, Flag } from 'lucide-react';
import { CountryId } from '../types';
import { COUNTRIES_DATA } from '../data/countries';
import { secureWallet } from '../services/securityWallet';

interface GameOverModalProps {
  isOpen: boolean;
  reason: string;
  earnedEnergy: number;
  playerCountryId: CountryId;
  playerName: string;
  peakMass: number;
  kills: number;
  debrisCollected: number;
  onRespawn: (startingCharge: number) => void;
  onChangeCountry: () => void;
  onOpenWallet: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  reason,
  earnedEnergy,
  playerCountryId,
  playerName,
  peakMass,
  kills,
  debrisCollected,
  onRespawn,
  onChangeCountry,
  onOpenWallet,
}) => {
  const [startingCharge, setStartingCharge] = useState<number>(0);

  if (!isOpen) return null;

  const country = COUNTRIES_DATA[playerCountryId] || COUNTRIES_DATA.KSA;
  const wallet = secureWallet.getWallet();

  const handleStartAgain = () => {
    if (startingCharge > 0) {
      const ok = secureWallet.chargeBall(startingCharge);
      if (ok.success) {
        onRespawn(startingCharge);
        return;
      }
    }
    onRespawn(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div
        id="gameover-modal-container"
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-slate-900 border border-red-500/40 shadow-2xl shadow-red-950/60 p-6 flex flex-col gap-4 text-center"
      >
        {/* Banner */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl">{country.flag}</span>
          <h2 className="text-2xl font-black text-white">انتهت الجولة السيادية</h2>
          <p className="text-xs text-red-400 font-semibold">{reason}</p>
        </div>

        {/* Energy Yield Summary */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 flex flex-col gap-2">
          <div className="text-xs text-amber-400/80 font-bold">تم تحويل وتوثيق أرباح الطاقة في محفظتك:</div>
          <div className="text-3xl font-black text-amber-400 flex items-center justify-center gap-2">
            <span>+{earnedEnergy.toLocaleString()}</span>
            <span className="text-sm font-normal text-slate-300">نقطة سيادية EN</span>
          </div>
          <div className="text-[11px] text-slate-400">
            رصيدك الجديد: <span className="text-emerald-400 font-bold">{wallet.energyBalance.toLocaleString()} EN</span>
          </div>
        </div>

        {/* Battle Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-slate-400 text-[10px]">أعلى كتلة</div>
            <div className="text-base font-black text-cyan-400">{Math.round(peakMass)}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-slate-400 text-[10px]">ابتلاعات</div>
            <div className="text-base font-black text-emerald-400">{kills}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-slate-400 text-[10px]">كبسولات فتات</div>
            <div className="text-base font-black text-purple-400">{debrisCollected}</div>
          </div>
        </div>

        {/* Pre-charge Starting Orb Option */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2 text-right">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200">شحن مسبق للجولة القادمة:</span>
            <span className="text-amber-400 font-mono font-bold">+{startingCharge} EN</span>
          </div>
          <div className="flex items-center gap-2">
            {[0, 25, 50, 100].map(val => (
              <button
                key={val}
                onClick={() => setStartingCharge(val)}
                disabled={wallet.energyBalance < val}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  startingCharge === val
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30'
                }`}
              >
                {val === 0 ? 'بدون' : `+${val}`}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            id="respawn-button"
            onClick={handleStartAgain}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-sm transition-all flex items-center justify-center gap-2 shadow-xl shadow-cyan-950/60 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>العودة للميدان فوراً</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onChangeCountry}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Flag className="w-4 h-4" />
              <span>تغيير الدولة</span>
            </button>
            <button
              onClick={onOpenWallet}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>إدارة المحفظة</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

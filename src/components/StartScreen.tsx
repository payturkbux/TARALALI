import React, { useState } from 'react';
import { Play, Shield, Zap, Wallet, Trophy, Sparkles, Globe, ChevronDown, Check } from 'lucide-react';
import { CountryId } from '../types';
import { COUNTRIES_LIST, COUNTRIES_DATA } from '../data/countries';
import { secureWallet } from '../services/securityWallet';
import { soundManager } from '../services/sound';

interface StartScreenProps {
  onStartGame: (name: string, countryId: CountryId, startingCharge: number) => void;
  onOpenWallet: () => void;
  onOpenLeaderboard: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStartGame,
  onOpenWallet,
  onOpenLeaderboard,
}) => {
  const [name, setName] = useState<string>('فارس_الصحراء');
  const [selectedCountryId, setSelectedCountryId] = useState<CountryId>('KSA');
  const [startingCharge, setStartingCharge] = useState<number>(0);
  const [showCountryGrid, setShowCountryGrid] = useState<boolean>(false);

  const country = COUNTRIES_DATA[selectedCountryId] || COUNTRIES_DATA.KSA;
  const wallet = secureWallet.getWallet();

  const handleStart = () => {
    soundManager.playBallSupercharge();
    if (startingCharge > 0) {
      const ok = secureWallet.chargeBall(startingCharge);
      if (ok.success) {
        onStartGame(name, selectedCountryId, startingCharge);
        return;
      }
    }
    onStartGame(name, selectedCountryId, 0);
  };

  return (
    <div id="start-screen-overlay" className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg overflow-y-auto">
      <div className="relative w-full max-w-xl p-6 md:p-8 rounded-3xl bg-slate-900/95 border border-cyan-500/30 shadow-2xl shadow-cyan-950/70 flex flex-col gap-6 text-right">
        {/* Title & Brand */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex items-center justify-center gap-2 text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-amber-300 to-emerald-400">
            <span>AgarMideast</span>
            <span className="text-3xl">⚔️</span>
          </div>
          <p className="text-sm md:text-base font-bold text-slate-300">
            حرب طاقة ومخازن الشرق الأوسط العشرين
          </p>
          <div className="flex items-center gap-2 text-xs text-cyan-400/90 font-medium">
            <span>أبراج حماية ليزرية • 20 مخزناً وطنياً • محفظة طاقة موثقة</span>
          </div>
        </div>

        {/* Input Player Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 block">اسم البطل المحارب:</label>
          <input
            id="input-player-name"
            type="text"
            value={name}
            maxLength={18}
            onChange={e => setName(e.target.value)}
            placeholder="اكتب لقبك في المعركة..."
            className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-sm font-bold text-white focus:border-cyan-400 outline-none transition-all"
          />
        </div>

        {/* Selected Country Banner & Selector Button */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">الراية والمخزن الوطني:</span>
            <button
              onClick={() => setShowCountryGrid(!showCountryGrid)}
              className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>{showCountryGrid ? 'إخفاء القائمة' : 'تغيير الدولة (20 دولة)'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCountryGrid ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Current Country Card */}
          <div
            onClick={() => setShowCountryGrid(!showCountryGrid)}
            className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/40 hover:border-cyan-400 transition-all flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl md:text-4xl">{country.flag}</span>
              <div>
                <div className="font-black text-base text-white flex items-center gap-2">
                  <span>{country.nameAr}</span>
                  <span className="text-xs text-cyan-400 font-mono">({country.code})</span>
                </div>
                <div className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{country.perkName}: {country.perkDescAr}</span>
                </div>
              </div>
            </div>

            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: country.primaryColor }} />
          </div>

          {/* Expandable Country Grid */}
          {showCountryGrid && (
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 max-h-56 overflow-y-auto no-scrollbar grid grid-cols-2 sm:grid-cols-4 gap-2 animate-fade-in">
              {COUNTRIES_LIST.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCountryId(c.id);
                    setShowCountryGrid(false);
                    soundManager.playPelletEat(2);
                  }}
                  className={`p-2.5 rounded-xl border text-right flex items-center gap-2 transition-all cursor-pointer ${
                    selectedCountryId === c.id
                      ? 'bg-cyan-950/50 border-cyan-400 ring-1 ring-cyan-400'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xl">{c.flag}</span>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-white truncate">{c.nameAr}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{c.code}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Initial Energy Injection from Wallet */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-amber-400" />
              <span>شحن انطلاقة البداية من المحفظة:</span>
            </span>
            <span className="text-amber-400 font-bold font-mono">
              رصيد المحفظة: {wallet.energyBalance.toLocaleString()} EN
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[0, 25, 50, 100].map(amount => (
              <button
                key={amount}
                onClick={() => setStartingCharge(amount)}
                disabled={wallet.energyBalance < amount}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  startingCharge === amount
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-950/50'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed'
                }`}
              >
                {amount === 0 ? 'بدون شحن' : `+${amount} EN`}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            id="start-battle-button"
            onClick={handleStart}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-300 hover:from-cyan-300 hover:to-amber-200 text-slate-950 font-black text-base md:text-lg transition-all flex items-center justify-center gap-2 shadow-2xl shadow-cyan-950/70 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>انطلاق إلى ساحة المعركة السيادية</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onOpenWallet}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-amber-400 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>المحفظة الموثقة ({wallet.energyBalance} EN)</span>
            </button>
            <button
              onClick={onOpenLeaderboard}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-cyan-400 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              <span>لوحة السيادة الوطنية</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

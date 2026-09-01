import React from 'react';
import { X, Shield, Zap, Sparkles, Wind, Crosshair, Check } from 'lucide-react';
import { COUNTRIES_LIST, COUNTRIES_DATA } from '../data/countries';
import { CountryId } from '../types';
import { soundManager } from '../services/sound';

interface CountrySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCountryId: CountryId;
  onSelectCountry: (countryId: CountryId) => void;
}

export const CountrySelectModal: React.FC<CountrySelectModalProps> = ({
  isOpen,
  onClose,
  selectedCountryId,
  onSelectCountry,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div
        id="country-select-container"
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-2xl shadow-cyan-950/50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xl">
              🌍
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                <span>المخازن والدول العشرين للشرق الأوسط</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  20 دولة متنافسة
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                اختر رايتك الوطنية لتنضم لمخزنها وبرج حمايتها والحصول على مميزاتها التكتيكية
              </p>
            </div>
          </div>

          <button
            id="close-country-modal"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Countries Grid */}
        <div className="p-5 overflow-y-auto flex-1 no-scrollbar grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {COUNTRIES_LIST.map(country => {
            const isSelected = country.id === selectedCountryId;

            return (
              <div
                key={country.id}
                onClick={() => {
                  soundManager.playPelletEat(3);
                  onSelectCountry(country.id);
                }}
                className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-400 shadow-lg shadow-cyan-950/50 ring-2 ring-cyan-400/30'
                    : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800 hover:border-slate-700'
                }`}
                style={{
                  borderLeftColor: country.primaryColor,
                  borderLeftWidth: '5px',
                }}
              >
                {/* Top Row: Flag, Name, Code & Selected check */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl leading-none">{country.flag}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm md:text-base text-white group-hover:text-cyan-300 transition-colors">
                          {country.nameAr}
                        </span>
                        <span className="text-xs text-slate-400 font-mono font-bold">
                          ({country.code})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium italic">
                        "{country.motto}"
                      </div>
                    </div>
                  </div>

                  {isSelected ? (
                    <div className="p-1.5 rounded-full bg-cyan-500 text-slate-950">
                      <Check className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-slate-600 group-hover:border-cyan-400" />
                  )}
                </div>

                {/* Perk Badge */}
                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-2 text-xs">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300 ml-1">{country.perkName}:</span>
                    <span className="text-slate-300 text-[11px]">{country.perkDescAr}</span>
                  </div>
                </div>

                {/* Stats Bar Indicator */}
                <div className="grid grid-cols-4 gap-1.5 text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <div className="flex items-center gap-1">
                    <Wind className="w-3 h-3 text-cyan-400" />
                    <span>السرعة: x{country.speedMultiplier}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>الدرع: x{country.defenseMultiplier}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-red-400" />
                    <span>شحن البرج: x{country.laserChargeRateMultiplier}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Crosshair className="w-3 h-3 text-amber-400" />
                    <span>المغناطيس: x{country.capsuleAttractionMultiplier}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            الدولة المختارة: <span className="text-cyan-400 font-bold">{COUNTRIES_DATA[selectedCountryId]?.nameAr}</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-lg shadow-cyan-950/50"
          >
            تأكيد الراية الوطنية والدخول
          </button>
        </div>
      </div>
    </div>
  );
};

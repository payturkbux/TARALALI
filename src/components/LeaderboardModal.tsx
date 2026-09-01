import React, { useState } from 'react';
import { Trophy, Flag, Shield, Users, Zap, X } from 'lucide-react';
import { LeaderboardEntry, NationalRanking } from '../types';
import { COUNTRIES_DATA } from '../data/countries';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaderboard: LeaderboardEntry[];
  nationalRankings: NationalRanking[];
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  leaderboard,
  nationalRankings,
}) => {
  const [tab, setTab] = useState<'nations' | 'players'>('nations');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div
        id="leaderboard-modal-container"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl shadow-amber-950/50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-white">
                لوحة السيادة والتصنيف الإقليمي
              </h2>
              <p className="text-xs text-slate-400">
                الترتيب المباشر لقوى ومخازن الشرق الأوسط وأبطال الساحة
              </p>
            </div>
          </div>

          <button
            id="close-leaderboard-modal"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-2">
          <button
            onClick={() => setTab('nations')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              tab === 'nations'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>ترتيب الدول العشرين (السيادة الوطنية)</span>
          </button>
          <button
            onClick={() => setTab('players')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              tab === 'players'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>أبطال الميدان الأفراد</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 no-scrollbar space-y-2">
          {tab === 'nations' && (
            <div className="space-y-2">
              <div className="grid grid-cols-12 text-[11px] font-bold text-slate-400 px-3 py-1.5 bg-slate-950/80 rounded-xl">
                <span className="col-span-1 text-center">#</span>
                <span className="col-span-5">الدولة والمخزن الوطني</span>
                <span className="col-span-3 text-center">إجمالي طاقة السيادة</span>
                <span className="col-span-3 text-left">الأعضاء والبرج</span>
              </div>

              {nationalRankings.map((item, idx) => {
                const country = COUNTRIES_DATA[item.countryId];
                if (!country) return null;

                const isTop3 = idx < 3;
                const medalColors = ['text-amber-400', 'text-slate-300', 'text-amber-600'];

                return (
                  <div
                    key={item.countryId}
                    className={`grid grid-cols-12 items-center p-3 rounded-2xl border transition-all text-xs ${
                      isTop3
                        ? 'bg-slate-800/80 border-amber-500/30'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="col-span-1 text-center font-black">
                      {isTop3 ? (
                        <span className={`text-sm ${medalColors[idx]}`}>
                          #{idx + 1}
                        </span>
                      ) : (
                        <span className="text-slate-400">#{idx + 1}</span>
                      )}
                    </div>

                    <div className="col-span-5 flex items-center gap-2.5">
                      <span className="text-2xl leading-none">{country.flag}</span>
                      <div>
                        <div className="font-extrabold text-white flex items-center gap-1.5">
                          <span>{country.nameAr}</span>
                          <span className="text-[10px] text-slate-400">({country.code})</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{country.perkName}</div>
                      </div>
                    </div>

                    <div className="col-span-3 text-center">
                      <span className="font-extrabold text-amber-400 font-mono">
                        {item.totalEnergy.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">EN</span>
                    </div>

                    <div className="col-span-3 flex items-center justify-end gap-3 text-slate-300">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{item.activePlayers}</span>
                      </span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Zap className="w-3.5 h-3.5 text-red-400" />
                        <span>{item.towersActive}%</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'players' && (
            <div className="space-y-2">
              <div className="grid grid-cols-12 text-[11px] font-bold text-slate-400 px-3 py-1.5 bg-slate-950/80 rounded-xl">
                <span className="col-span-1 text-center">#</span>
                <span className="col-span-6">اسم البطل والدولة</span>
                <span className="col-span-5 text-left">كتلة الطاقة</span>
              </div>

              {leaderboard.map(player => {
                const country = COUNTRIES_DATA[player.countryId];

                return (
                  <div
                    key={player.rank}
                    className={`grid grid-cols-12 items-center p-3 rounded-2xl border transition-all text-xs ${
                      player.isPlayer
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-md ring-1 ring-cyan-400/40'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="col-span-1 text-center font-black text-amber-400">
                      #{player.rank}
                    </div>

                    <div className="col-span-6 flex items-center gap-2.5">
                      <span className="text-xl leading-none">{country?.flag || '🏳️'}</span>
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{player.name}</span>
                          {player.isPlayer && (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-500 text-slate-950 font-black text-[9px]">
                              أنت
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{country?.nameAr}</div>
                      </div>
                    </div>

                    <div className="col-span-5 text-left font-black text-emerald-400 font-mono text-sm">
                      {player.mass.toLocaleString()} EN
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

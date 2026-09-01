import React from 'react';
import { Zap, ShieldAlert, Sparkles, Trophy } from 'lucide-react';
import { GameEvent } from '../types';
import { COUNTRIES_DATA } from '../data/countries';

interface EventFeedProps {
  events: GameEvent[];
}

export const EventFeed: React.FC<EventFeedProps> = ({ events }) => {
  if (events.length === 0) return null;

  return (
    <div id="combat-event-feed" className="pointer-events-none absolute top-20 right-4 max-w-sm flex flex-col gap-1.5 z-10">
      {events.slice(0, 4).map(ev => {
        const country = ev.countryId ? COUNTRIES_DATA[ev.countryId] : null;

        return (
          <div
            key={ev.id}
            className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800/80 shadow-lg text-xs animate-fade-in"
          >
            {ev.type === 'LASER_STRIKE' && <Zap className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />}
            {ev.type === 'VAULT_SURGE' && <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />}
            {ev.type === 'EATEN' && <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />}
            {ev.type === 'RANK_ONE' && <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />}

            <div className="flex-1 leading-tight">
              <span className="font-semibold text-slate-200">{ev.textAr}</span>
            </div>

            {country && <span className="text-base shrink-0">{country.flag}</span>}
          </div>
        );
      })}
    </div>
  );
};

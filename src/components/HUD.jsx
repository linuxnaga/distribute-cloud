import { Award, RotateCcw, Target, Zap } from 'lucide-react';
import { useState } from 'react';
import { BADGES, RANKS, TOTAL_XP, badgeUnlocked, rankFor } from '../data/progression.js';
import { useGame } from '../state/GameContext.jsx';
import { Icon } from './icons.jsx';

export default function HUD() {
  const { state, resetAll } = useGame();
  const [confirmReset, setConfirmReset] = useState(false);
  const { current, next } = rankFor(state.xp);
  const span = next ? next.minXp - current.minXp : 1;
  const into = next ? state.xp - current.minXp : 1;
  const pct = Math.min(100, Math.round((into / span) * 100));
  const mastery = Math.round((state.xp / TOTAL_XP) * 100);

  return (
    <header className="relative z-40 border-b lg:sticky lg:top-0 border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative grid h-10 w-10 place-items-center rounded-full bg-f5 font-black text-white shadow-[0_0_24px_rgba(228,0,43,.45)]">
            f5
            <span className="absolute -right-1 -bottom-1 h-3.5 w-3.5 rounded-full border-2 border-ink bg-cyan" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-wide text-white">XC Flow Academy</div>
            <div className="text-[11px] text-slate-400">Distributed Cloud learning simulator</div>
          </div>
        </div>

        <div className="flex min-w-[260px] flex-1 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-f5/50 bg-f5/10 text-center">
            <div className="text-[9px] font-semibold uppercase text-coral">Lvl</div>
            <div className="-mt-1 text-lg font-black text-white">{current.level}</div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-semibold text-white" title="CloudOps Rank">
                {current.title}
              </span>
              <span className="shrink-0 font-mono text-[11px] text-slate-400">
                <Zap className="mr-1 inline h-3 w-3 text-amber-400" />
                {state.xp} XP{next ? ` · ${next.minXp - state.xp} to ${next.title}` : ' · max rank'}
              </span>
            </div>
            <div className="relative mt-1.5 h-2.5 overflow-hidden rounded-full bg-panel2 ring-1 ring-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="XP progress to next rank">
              <div className="h-full rounded-full bg-gradient-to-r from-f5 via-coral to-cyan transition-all duration-700" style={{ width: `${pct}%` }} />
              <div className="xp-shimmer absolute inset-0" />
            </div>
            <div className="mt-1 flex gap-1">
              {RANKS.map((r) => (
                <div key={r.level} className={`h-1 flex-1 rounded ${state.xp >= r.minXp ? 'bg-cyan/70' : 'bg-line'}`} title={`Lvl ${r.level}: ${r.title} (${r.minXp} XP)`} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-1.5" title="Mastery: share of all available XP earned">
          <Target className="h-4 w-4 text-emerald" />
          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-wide text-slate-400">Mastery</div>
            <div className="font-mono text-sm font-bold text-white">{mastery}%</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-slate-400" aria-hidden />
          {BADGES.map((b) => {
            const on = badgeUnlocked(b, state.awarded);
            return (
              <div
                key={b.id}
                className={`group relative grid h-9 w-9 place-items-center rounded-full border-2 transition ${on ? 'scale-100' : 'opacity-40 grayscale'}`}
                style={{ borderColor: on ? b.color : '#334155', background: on ? `${b.color}22` : 'transparent', boxShadow: on ? `0 0 16px ${b.color}66` : 'none' }}
                tabIndex={0}
                aria-label={`${b.name} badge ${on ? 'unlocked' : 'locked'}`}
              >
                <Icon name={b.icon} className="h-4 w-4" style={{ color: on ? b.color : '#94a3b8' }} />
                <div className="pointer-events-none absolute top-11 right-0 z-50 hidden w-60 rounded-lg border border-line bg-panel p-3 text-left text-xs shadow-xl group-hover:block group-focus:block">
                  <div className="font-semibold text-white">{b.name}</div>
                  <div className="mt-1 text-slate-400">{on ? 'Unlocked. Nice work.' : b.criteria}</div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => {
            if (confirmReset) {
              resetAll();
              setConfirmReset(false);
            } else {
              setConfirmReset(true);
              setTimeout(() => setConfirmReset(false), 3000);
            }
          }}
          className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition ${confirmReset ? 'border-rose-500 bg-rose-500/15 text-rose-300' : 'border-line text-slate-400 hover:text-white'}`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {confirmReset ? 'Click again to reset' : 'Reset'}
        </button>
      </div>
    </header>
  );
}

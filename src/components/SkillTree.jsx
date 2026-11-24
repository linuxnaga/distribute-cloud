import { CheckCircle2, Flag, Play, Trophy } from 'lucide-react';
import { BADGES, TASKS, badgeUnlocked } from '../data/progression.js';
import { MODULES } from '../data/curriculum.js';
import { MISSIONS } from '../data/missions.js';
import { useGame } from '../state/GameContext.jsx';
import { Icon } from './icons.jsx';

function moduleProgress(id, awarded) {
  const t = TASKS.filter((x) => x.module === id);
  const earned = t.filter((x) => awarded[x.id]).reduce((s, x) => s + x.xp, 0);
  const total = t.reduce((s, x) => s + x.xp, 0);
  return Math.round((earned / total) * 100);
}

export default function SkillTree({ view, setView }) {
  const { state } = useGame();
  return (
    <nav className="space-y-4" aria-label="Curriculum">
      <div>
        <div className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Skill tree</div>
        <ol className="relative space-y-2">
          <span className="absolute top-6 bottom-6 left-[21px] w-px bg-line" aria-hidden />
          {MODULES.map((m) => {
            const pct = moduleProgress(m.id, state.awarded);
            const badge = BADGES.find((b) => b.module === m.id);
            const done = badgeUnlocked(badge, state.awarded);
            const active = view.type === 'module' && view.id === m.id;
            return (
              <li key={m.id} className="relative">
                <button
                  onClick={() => setView({ type: 'module', id: m.id })}
                  className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left transition ${active ? 'bg-panel2' : 'border-transparent hover:border-line hover:bg-panel/60'}`}
                  style={active ? { borderColor: `${m.color}88` } : undefined}
                  aria-current={active ? 'page' : undefined}
                >
                  <span
                    className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 bg-ink"
                    style={{ borderColor: done ? m.color : pct > 0 ? `${m.color}99` : '#334155', color: m.color }}
                  >
                    {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon name={m.icon} className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold uppercase tracking-wide" style={{ color: m.color }}>
                      Module {m.num}
                    </span>
                    <span className="block truncate text-sm font-semibold text-white">{m.short}</span>
                    <span className="mt-1 block h-1 overflow-hidden rounded bg-line">
                      <span className="block h-full rounded transition-all" style={{ width: `${pct}%`, background: m.color }} />
                    </span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">{pct}%</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <Trophy className="h-3.5 w-3.5" /> Missions
        </div>
        <div className="space-y-1.5">
          {MISSIONS.map((ms) => {
            const done = state.missionsDone[ms.id];
            const active = (view.type === 'mission' && view.id === ms.id) || state.mission?.id === ms.id;
            return (
              <button
                key={ms.id}
                onClick={() => setView({ type: 'mission', id: ms.id })}
                className={`flex w-full items-center gap-2 rounded-lg border p-2 text-left text-xs transition ${view.type === 'mission' && view.id === ms.id ? 'border-f5/60 bg-panel2' : 'border-line hover:bg-panel/60'}`}
              >
                <Icon name={ms.icon} className="h-4 w-4 shrink-0" style={{ color: ms.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-white">Mission {ms.num}</span>
                  <span className="block truncate text-slate-400">{ms.title}</span>
                </span>
                {done ? <Flag className="h-3.5 w-3.5 text-emerald" /> : active ? <span className="h-2 w-2 animate-pulse rounded-full bg-f5" /> : <Play className="h-3 w-3 text-slate-500" />}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

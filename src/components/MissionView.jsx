import { CheckCircle2, Circle, Flag, LogOut, Play, RotateCcw, Timer, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MISSIONS, MISSION_CANVAS } from '../data/missions.js';
import { eventSince, useGame } from '../state/GameContext.jsx';
import { Icon } from './icons.jsx';
import { Btn } from './ui.jsx';
import Workbench from './Workbench.jsx';

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function MissionView({ id }) {
  const { state, startMission, exitMission } = useGame();
  const m = MISSIONS.find((x) => x.id === id);
  const active = state.mission?.id === id ? state.mission : null;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active || active.completedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);

  const otherActive = state.mission && state.mission.id !== id && !state.mission.completedAt;
  const best = state.missionsDone[id];

  if (!active) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="overflow-hidden rounded-2xl border border-line bg-panel/70">
          <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${m.color}, #e4002b)` }} />
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl" style={{ background: `${m.color}22`, color: m.color }}>
                <Icon name={m.icon} className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Mission {m.num}</div>
                <h1 className="text-2xl font-bold text-white">{m.title}</h1>
              </div>
            </div>
            <p className="mt-2 text-sm font-semibold" style={{ color: m.color }}>
              {m.tagline}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">{m.brief}</p>
            <div className="mt-5">
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Objectives</div>
              <ol className="space-y-1.5">
                {m.objectives.map((o, i) => (
                  <li key={o.event} className="flex gap-2 text-sm text-slate-200">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-panel2 font-mono text-[11px]">{i + 1}</span>
                    {o.label}
                  </li>
                ))}
              </ol>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Btn onClick={() => startMission(id)} className="!px-5 !py-2">
                <Play className="h-4 w-4" /> {best ? 'Replay mission' : 'Start mission'}
              </Btn>
              <span className="text-xs text-slate-400">
                +200 XP on first completion{best ? ` · Completed in ${fmt(best)}` : ''}
              </span>
            </div>
            {otherActive && <p className="mt-3 text-xs text-amber-300">Starting this mission will leave your current mission in progress.</p>}
            <p className="mt-3 text-[11px] text-slate-500">Starting resets the simulator objects this mission uses so you play it from a clean state. Your XP and badges are kept.</p>
          </div>
        </div>
      </div>
    );
  }

  const elapsed = Math.round(((active.completedAt || now) - active.startedAt) / 1000);
  const doneCount = m.objectives.filter((o) => eventSince(state, o.event, active.startedAt)).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-xl border border-line bg-panel/70 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Icon name={m.icon} className="h-6 w-6" style={{ color: m.color }} />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Mission {m.num} · in progress</div>
              <h1 className="text-lg font-bold text-white">{m.title}</h1>
            </div>
            <div className="flex items-center gap-1.5 rounded-md border border-line bg-ink px-2.5 py-1 font-mono text-sm text-white">
              <Timer className="h-4 w-4 text-cyan" /> {fmt(elapsed)}
            </div>
            <Btn variant="ghost" onClick={() => startMission(id)} title="Restart mission">
              <RotateCcw className="h-4 w-4" />
            </Btn>
            <Btn variant="ghost" onClick={exitMission}>
              <LogOut className="h-4 w-4" /> Exit
            </Btn>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{m.brief}</p>
          {active.completedAt && (
            <div className="mt-3 rounded-lg border border-emerald/50 bg-emerald/10 p-3">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald">
                <Trophy className="h-4 w-4" /> Mission complete in {fmt(elapsed)}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-emerald-100">{m.debrief}</p>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-line bg-panel/70 p-4">
          <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1.5">
              <Flag className="h-3.5 w-3.5" /> Objectives
            </span>
            <span className="font-mono">
              {doneCount}/{m.objectives.length}
            </span>
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full transition-all" style={{ width: `${(doneCount / m.objectives.length) * 100}%`, background: m.color }} />
          </div>
          <ul className="space-y-2">
            {m.objectives.map((o) => {
              const ok = eventSince(state, o.event, active.startedAt);
              return (
                <li key={o.event} className="flex items-start gap-2 text-xs">
                  {ok ? <CheckCircle2 className="mt-px h-4 w-4 shrink-0 text-emerald" /> : <Circle className="mt-px h-4 w-4 shrink-0 text-slate-600" />}
                  <span className={ok ? 'text-slate-400 line-through' : 'text-slate-200'}>{o.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <Workbench key={`${id}-${active.startedAt}`} canvasModule={MISSION_CANVAS[id]} labIds={m.labs} />
    </div>
  );
}

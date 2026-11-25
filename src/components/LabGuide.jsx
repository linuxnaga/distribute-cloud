import { BookOpen, CheckCircle2, ChevronDown, Circle, Eye, EyeOff, Flag, Lightbulb, ListChecks, Target, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { GUIDES } from '../data/guides.js';
import { TASK_BY_ID } from '../data/progression.js';
import { REF_BY_ID } from '../data/reference.js';
import { useGame } from '../state/GameContext.jsx';
import { useReference } from '../state/ReferenceContext.jsx';

const KEY = 'xc-guide-open';

// Step-by-step instructions shown above every console lab.
export default function LabGuide({ labId, label }) {
  const { state } = useGame();
  const { openRef } = useReference();
  const g = GUIDES[labId];
  const [open, setOpen] = useState(() => localStorage.getItem(KEY) !== '0');
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    setShowHints(false);
    setShowSolution(false);
  }, [labId]);

  if (!g) return null;
  const toggle = () => {
    setOpen((v) => {
      localStorage.setItem(KEY, v ? '0' : '1');
      return !v;
    });
  };
  const tasks = g.tasks.map((id) => TASK_BY_ID[id]).filter(Boolean);
  const done = tasks.filter((t) => state.awarded[t.id]).length;

  return (
    <section className="rounded-xl border border-cyan/30 bg-panel/80" aria-label={`Lab guide: ${label}`}>
      <button onClick={toggle} aria-expanded={open} className="flex w-full items-center gap-2 px-3 py-2 text-left">
        <BookOpen className="h-4 w-4 shrink-0 text-cyan" />
        <span className="text-xs font-bold uppercase tracking-wider text-cyan">How to run this lab</span>
        <span className="truncate text-xs font-semibold text-white">{label}</span>
        <span className={`ml-auto shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] ${done === tasks.length ? 'bg-emerald/15 text-emerald' : 'bg-panel2 text-slate-400'}`}>
          {done}/{tasks.length} done
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="max-h-[360px] space-y-3 overflow-y-auto border-t border-line px-3 pt-2.5 pb-3 text-xs scroll-thin">
          <div className="flex gap-2">
            <Target className="mt-px h-3.5 w-3.5 shrink-0 text-f5" />
            <p className="leading-relaxed text-slate-200">
              <b className="text-white">Objective: </b>
              {g.objective}
            </p>
          </div>

          {g.before && (
            <div className="flex gap-2 rounded-md border border-amber-400/30 bg-amber-400/5 p-2 text-amber-100">
              <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span>
                <b>Before you start:</b> {g.before}
              </span>
            </div>
          )}

          <div>
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <ListChecks className="h-3.5 w-3.5" /> Steps
            </div>
            <ol className="space-y-1.5">
              {g.steps.map((s, i) => (
                <li key={i} className="flex gap-2 text-slate-300">
                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-cyan/15 font-mono text-[10px] font-bold text-cyan">{i + 1}</span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex gap-2 rounded-md border border-emerald/30 bg-emerald/5 p-2 text-emerald-100">
            <Flag className="mt-px h-3.5 w-3.5 shrink-0 text-emerald" />
            <span>
              <b>Success looks like:</b> {g.expected}
            </span>
          </div>

          <div>
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">XP objectives</div>
            <ul className="space-y-0.5">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-1.5">
                  {state.awarded[t.id] ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald" /> : <Circle className="h-3.5 w-3.5 shrink-0 text-slate-600" />}
                  <span className={state.awarded[t.id] ? 'text-slate-500 line-through' : 'text-slate-300'}>{t.label}</span>
                  <span className="ml-auto font-mono text-[10px] text-amber-400">+{t.xp}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setShowHints((v) => !v)}
              aria-expanded={showHints}
              className="flex items-center gap-1 rounded-md border border-amber-400/40 px-2 py-1 font-semibold text-amber-300 hover:bg-amber-400/10"
            >
              <Lightbulb className="h-3.5 w-3.5" /> {showHints ? 'Hide hints' : `Hints (${g.hints.length})`}
            </button>
            <button
              onClick={() => setShowSolution((v) => !v)}
              aria-expanded={showSolution}
              className="flex items-center gap-1 rounded-md border border-line px-2 py-1 font-semibold text-slate-300 hover:border-slate-500"
            >
              {showSolution ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {showSolution ? 'Hide solution' : 'Reveal solution'}
            </button>
          </div>
          {showHints && (
            <ul className="space-y-1 rounded-md border border-amber-400/30 bg-amber-400/5 p-2">
              {g.hints.map((h) => (
                <li key={h} className="flex gap-2 text-amber-100">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                  {h}
                </li>
              ))}
            </ul>
          )}
          {showSolution && (
            <div className="rounded-md border border-line bg-ink p-2">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Solution (try it yourself first)</div>
              <ul className="space-y-0.5 font-mono text-[11px] text-slate-200">
                {g.solution.map((s) => (
                  <li key={s}>› {s}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Components in this lab · click to learn what they do</div>
            <div className="flex flex-wrap gap-1.5">
              {g.refs.map((id) => (
                <button key={id} onClick={() => openRef(id)} className="rounded-full border border-cyan/40 bg-cyan/5 px-2 py-0.5 text-[11px] text-cyan hover:bg-cyan/15">
                  {REF_BY_ID[id]?.name.replace(/ \(.*\)$/, '')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

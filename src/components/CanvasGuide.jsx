import { CheckCircle2, ChevronDown, Circle, MousePointerClick } from 'lucide-react';
import { useState } from 'react';
import { CANVAS_GUIDE } from '../data/guides.js';
import { TASK_BY_ID } from '../data/progression.js';
import { useGame } from '../state/GameContext.jsx';

// Explains the diagram's flow and layer buttons, plus this module's canvas exercises.
export default function CanvasGuide({ moduleId }) {
  const { state } = useGame();
  const [open, setOpen] = useState(false);
  const tasks = (CANVAS_GUIDE.byModule[moduleId] || []).map((x) => ({ ...x, t: TASK_BY_ID[x.task] }));
  const done = tasks.filter((x) => state.awarded[x.task]).length;

  return (
    <section className="rounded-xl border border-line bg-panel/60">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center gap-2 px-3 py-2 text-left">
        <MousePointerClick className="h-4 w-4 text-emerald" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">How to use the diagram</span>
        {tasks.length > 0 && (
          <span className={`ml-auto rounded px-1.5 py-0.5 font-mono text-[10px] ${done === tasks.length ? 'bg-emerald/15 text-emerald' : 'bg-panel2 text-slate-400'}`}>
            {done}/{tasks.length} canvas tasks
          </span>
        )}
        <ChevronDown className={`h-4 w-4 text-slate-400 transition ${tasks.length ? '' : 'ml-auto'} ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-line px-3 pt-2.5 pb-3 text-xs">
          <p className="leading-relaxed text-slate-300">{CANVAS_GUIDE.intro}</p>
          <dl className="grid gap-x-3 gap-y-1 sm:grid-cols-2">
            {CANVAS_GUIDE.controls.map(([k, v]) => (
              <div key={k}>
                <dt className="inline font-semibold text-white">{k}: </dt>
                <dd className="inline text-slate-400">{v}</dd>
              </div>
            ))}
          </dl>
          {tasks.length > 0 && (
            <div>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Canvas exercises in this module</div>
              <ul className="space-y-1.5">
                {tasks.map(({ task, how, t }) => (
                  <li key={task} className="flex gap-2">
                    {state.awarded[task] ? <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0 text-emerald" /> : <Circle className="mt-px h-3.5 w-3.5 shrink-0 text-slate-600" />}
                    <span>
                      <span className="font-semibold text-white">{t?.label}</span> <span className="font-mono text-[10px] text-amber-400">+{t?.xp}</span>
                      <span className="block text-slate-400">{how}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

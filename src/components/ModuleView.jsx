import { BookOpen, CheckCircle2, Circle, FlaskConical, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { TASKS } from '../data/progression.js';
import { useGame } from '../state/GameContext.jsx';
import { Icon } from './icons.jsx';
import Quiz from './Quiz.jsx';
import Workbench from './Workbench.jsx';

export default function ModuleView({ module }) {
  const { state } = useGame();
  const [tab, setTab] = useState('lab');
  const [showConcepts, setShowConcepts] = useState(true);
  const tasks = TASKS.filter((t) => t.module === module.id && t.kind !== 'quiz');
  const quizDone = TASKS.filter((t) => t.module === module.id && t.kind === 'quiz' && state.awarded[t.id]).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-xl border border-line bg-panel/70 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: `${module.color}22`, color: module.color }}>
              <Icon name={module.icon} className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: module.color }}>
                Module {module.num}
              </div>
              <h1 className="text-lg font-bold text-white sm:text-xl">{module.title}</h1>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{module.summary}</p>
          <button onClick={() => setShowConcepts((v) => !v)} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-cyan hover:underline">
            <BookOpen className="h-3.5 w-3.5" /> {showConcepts ? 'Hide' : 'Show'} key concepts
          </button>
          {showConcepts && (
            <div className="mt-2 grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
              {module.concepts.map((c) => (
                <div key={c.term} className="rounded-lg border border-line bg-ink/60 p-2.5">
                  <div className="text-xs font-bold text-white">{c.term}</div>
                  <div className="mt-0.5 text-xs leading-relaxed text-slate-400">{c.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-line bg-panel/70 p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Module objectives</div>
          <ul className="max-h-[360px] space-y-1.5 overflow-y-auto pr-1 scroll-thin">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-start gap-2 text-xs">
                {state.awarded[t.id] ? <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0 text-emerald" /> : <Circle className="mt-px h-3.5 w-3.5 shrink-0 text-slate-600" />}
                <span className={state.awarded[t.id] ? 'text-slate-400 line-through' : 'text-slate-200'}>{t.label}</span>
                <span className="ml-auto shrink-0 font-mono text-[10px] text-amber-400">+{t.xp}</span>
              </li>
            ))}
            <li className="flex items-start gap-2 text-xs">
              {quizDone === 5 ? <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0 text-emerald" /> : <Circle className="mt-px h-3.5 w-3.5 shrink-0 text-slate-600" />}
              <span className="text-slate-200">Knowledge check ({quizDone}/5)</span>
              <span className="ml-auto shrink-0 font-mono text-[10px] text-amber-400">+100</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex gap-1.5 border-b border-line" role="tablist">
        {[
          { id: 'lab', label: 'Flow Visualizer & Console Lab', icon: FlaskConical },
          { id: 'quiz', label: `Knowledge Check (${quizDone}/5)`, icon: HelpCircle },
        ].map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold ${tab === t.id ? 'border-f5 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'lab' ? <Workbench key={module.id} canvasModule={module} labIds={module.labs.map((l) => l.id)} /> : <div className="max-w-4xl"><Quiz moduleId={module.id} /></div>}
    </div>
  );
}

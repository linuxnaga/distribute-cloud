import { CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { QUIZZES } from '../data/quizzes.js';
import { useGame } from '../state/GameContext.jsx';

export default function Quiz({ moduleId }) {
  const { state, award } = useGame();
  const questions = QUIZZES[moduleId];
  const [picked, setPicked] = useState({});
  const correctCount = questions.filter((_, i) => state.awarded[`quiz.${moduleId}.${i}`]).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-line bg-panel px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <HelpCircle className="h-4 w-4 text-cyan" /> Knowledge check
        </div>
        <div className="font-mono text-xs text-slate-400">
          {correctCount}/{questions.length} mastered · 20 XP each
        </div>
      </div>
      {questions.map((q, i) => {
        const id = `quiz.${moduleId}.${i}`;
        const mastered = !!state.awarded[id];
        const p = picked[i];
        const answered = p !== undefined;
        return (
          <div key={i} data-quiz={i} className={`rounded-xl border p-4 ${mastered ? 'border-emerald/40 bg-emerald/5' : 'border-line bg-panel/60'}`}>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-panel2 font-mono text-[11px] text-slate-300">{i + 1}</span>
              <p className="text-sm font-semibold text-white">{q.q}</p>
              {mastered && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald" />}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {q.options.map((o, j) => {
                const chosen = p === j;
                const isRight = j === q.answer;
                let cls = 'border-line text-slate-300 hover:border-slate-500';
                if (answered && chosen) cls = isRight ? 'border-emerald bg-emerald/15 text-emerald' : 'border-rose-500 bg-rose-500/15 text-rose-200';
                else if (mastered && isRight && !answered) cls = 'border-emerald/40 text-emerald';
                return (
                  <button
                    key={j}
                    onClick={() => {
                      setPicked((s) => ({ ...s, [i]: j }));
                      if (isRight) award(id);
                    }}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition ${cls}`}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
            {answered && (
              <div className={`mt-3 flex gap-2 text-xs ${p === q.answer ? 'text-emerald' : 'text-rose-300'}`}>
                {p === q.answer ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
                <span>{p === q.answer ? q.why : 'Not quite. Try another option.'}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

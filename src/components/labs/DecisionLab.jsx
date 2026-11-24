import { CheckCircle2, Play } from 'lucide-react';
import { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { Btn, Callout, ConsoleFrame } from '../ui.jsx';
import ChoiceGrid, { allOk, initial } from './ChoiceGrid.jsx';

// Data-driven lab: a scenario, a set of decisions, and a simulated run.
export default function DecisionLab({ spec }) {
  const { award, emit } = useGame();
  const [vals, setVals] = useState({ ...initial(spec.items), ...(spec.start || {}) });
  const [checked, setChecked] = useState(false);
  const ok = allOk(spec.items, vals);
  const run = () => {
    setChecked(true);
    if (ok) {
      award(spec.task);
      emit(spec.event);
    }
  };
  const Icon = spec.icon;
  return (
    <ConsoleFrame crumbs={spec.crumbs} activeNav={spec.nav} namespace={spec.ns}>
      <div className="space-y-3">
        <Callout tone="info" icon={Icon}>
          {spec.intro}
        </Callout>
        <ChoiceGrid items={spec.items} values={vals} checked={checked} onChange={(k, v) => { setVals((s) => ({ ...s, [k]: v })); setChecked(false); }} />
        <Btn variant="cyan" onClick={run}>
          <Play className="h-4 w-4" /> {spec.runLabel}
        </Btn>
        {checked && !ok && <Callout tone="bad">{spec.bad}</Callout>}
        {checked && ok && (
          <div className="space-y-2">
            {spec.log && (
              <div className="rounded-lg border border-line bg-black/60 p-3 font-mono text-[11px] leading-relaxed text-slate-300">
                {spec.log.map((l, i) => (
                  <div key={i} className={i === spec.log.length - 1 ? 'text-emerald' : ''}>
                    {l}
                  </div>
                ))}
              </div>
            )}
            <Callout tone="ok" icon={CheckCircle2}>
              {spec.good}
            </Callout>
          </div>
        )}
      </div>
    </ConsoleFrame>
  );
}

import { CheckCircle2, XCircle } from 'lucide-react';
import { inputCls } from '../ui.jsx';

// A list of decisions, each a select with a validator and a hint shown when wrong.
export default function ChoiceGrid({ items, values, onChange, checked }) {
  return (
    <div className="space-y-2">
      {items.map((it) => {
        const ok = it.ok(values[it.id]);
        return (
          <div key={it.id} className="grid items-start gap-2 rounded-lg border border-line bg-panel/60 p-2.5 sm:grid-cols-[1fr_220px]">
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                {it.title}
                {checked && (ok ? <CheckCircle2 className="h-4 w-4 text-emerald" /> : <XCircle className="h-4 w-4 text-rose-400" />)}
              </div>
              {it.desc && <div className="text-xs text-slate-400">{it.desc}</div>}
              {checked && !ok && <div className="mt-1 text-[11px] text-rose-300">{it.hint}</div>}
            </div>
            <select aria-label={it.title} className={inputCls} value={values[it.id]} onChange={(e) => onChange(it.id, e.target.value)}>
              {it.options.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}

export const allOk = (items, values) => items.every((it) => it.ok(values[it.id]));
export const initial = (items) => Object.fromEntries(items.map((it) => [it.id, it.options[0][0]]));

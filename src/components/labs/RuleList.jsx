import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

// Ordered, first-match rule editor shared by the firewall and service policy labs.
export default function RuleList({ palette, rules, setRules, defaultLabel }) {
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= rules.length) return;
    const next = [...rules];
    [next[i], next[j]] = [next[j], next[i]];
    setRules(next);
  };
  const unused = palette.filter((p) => !rules.includes(p.id));
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div>
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Rule library</div>
        <div className="space-y-1.5">
          {unused.map((r) => (
            <button key={r.id} onClick={() => setRules([...rules, r.id])} className="flex w-full items-start gap-2 rounded-md border border-line p-2 text-left text-xs hover:border-cyan">
              <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan" />
              <RuleText r={r} />
            </button>
          ))}
          {unused.length === 0 && <div className="text-xs text-slate-500">All rules are in the policy.</div>}
        </div>
      </div>
      <div>
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Active policy (first match wins)</div>
        <ol className="space-y-1.5">
          {rules.map((id, i) => {
            const r = palette.find((p) => p.id === id);
            return (
              <li key={id} className="flex items-start gap-2 rounded-md border border-line bg-panel/60 p-2 text-xs">
                <span className="mt-0.5 font-mono text-slate-500">{i + 1}</span>
                <RuleText r={r} />
                <span className="ml-auto flex shrink-0 gap-0.5">
                  <button aria-label="Move rule up" onClick={() => move(i, -1)} className="rounded p-0.5 text-slate-400 hover:text-white"><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button aria-label="Move rule down" onClick={() => move(i, 1)} className="rounded p-0.5 text-slate-400 hover:text-white"><ArrowDown className="h-3.5 w-3.5" /></button>
                  <button aria-label="Remove rule" onClick={() => setRules(rules.filter((x) => x !== id))} className="rounded p-0.5 text-slate-400 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </span>
              </li>
            );
          })}
          <li className="rounded-md border border-dashed border-line p-2 font-mono text-[11px] text-slate-500">{rules.length + 1}. {defaultLabel}</li>
        </ol>
      </div>
    </div>
  );
}

function RuleText({ r }) {
  return (
    <span className="min-w-0">
      <span className={`mr-1.5 rounded px-1 py-px font-mono text-[10px] font-bold uppercase ${r.action === 'allow' ? 'bg-emerald/15 text-emerald' : 'bg-rose-500/15 text-rose-300'}`}>{r.action}</span>
      <span className="font-mono text-slate-200">{r.label}</span>
    </span>
  );
}

export function evaluate(rules, palette, req, fallback) {
  for (const [i, id] of rules.entries()) {
    const r = palette.find((p) => p.id === id);
    if (r.match(req)) return { action: r.action, by: `rule ${i + 1}` };
  }
  return { action: fallback, by: 'default' };
}

export function TestTable({ tests, results }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-xs">
        <thead className="bg-panel2 text-slate-400">
          <tr>
            <th className="px-2 py-1.5 text-left">Test traffic</th>
            <th className="px-2 py-1.5">Expected</th>
            <th className="px-2 py-1.5">Result</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((t, i) => {
            const r = results?.[i];
            const ok = r && r.action === t.expect;
            return (
              <tr key={i} className={`border-t border-line ${r ? (ok ? 'bg-emerald/5' : 'bg-rose-500/10') : ''}`}>
                <td className="px-2 py-1.5 font-mono text-slate-200">{t.label}</td>
                <td className="px-2 py-1.5 text-center font-mono uppercase text-slate-400">{t.expect}</td>
                <td className={`px-2 py-1.5 text-center font-mono ${r ? (ok ? 'text-emerald' : 'font-bold text-rose-400') : 'text-slate-600'}`}>
                  {r ? `${r.action.toUpperCase()} (${r.by})` : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

import { CheckCircle2, Layers, Play } from 'lucide-react';
import { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { Btn, Callout, ConsoleFrame } from '../ui.jsx';

const SEGS = ['prod', 'dev', 'pci', 'shared'];
const PAIRS = [
  ['prod', 'shared', true, 'Every segment needs DNS, NTP and AD in shared-services.'],
  ['dev', 'shared', true, 'Every segment needs DNS, NTP and AD in shared-services.'],
  ['pci', 'shared', true, 'Every segment needs DNS, NTP and AD in shared-services.'],
  ['prod', 'pci', true, 'Checkout in prod must call the tokenization service in the PCI segment.'],
  ['dev', 'prod', false, 'Dev must never reach production data. A compromised test box would become a path into prod.'],
  ['dev', 'pci', false, 'Anything that can reach the cardholder environment is in PCI scope. Keep dev out.'],
];
const key = (a, b) => `${a}-${b}`;

export default function SegmentationLab() {
  const { award, emit } = useGame();
  const [allow, setAllow] = useState(Object.fromEntries(PAIRS.map(([a, b]) => [key(a, b), true])));
  const [res, setRes] = useState(null);

  const run = () => {
    const rows = PAIRS.map(([a, b, want, why]) => ({ a, b, want, got: allow[key(a, b)], why }));
    setRes(rows);
    if (rows.every((r) => r.want === r.got)) {
      award('m2.segments');
      emit('segments.pass');
    }
  };
  const pass = res && res.every((r) => r.want === r.got);

  return (
    <ConsoleFrame crumbs={['Multi-Cloud Network Connect', 'Networking', 'Segments', 'Segment Connectors']} activeNav="Networking" namespace="system">
      <div className="space-y-3">
        <Callout tone="info" icon={Layers}>
          Segments isolate networks end to end across every CE and cloud. Today everything is in one flat network. Split it into <span className="font-mono">{SEGS.join(', ')}</span> and connect only what each workload needs. Click a cell to allow or deny.
        </Callout>
        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr>
                <th />
                {SEGS.map((s) => (
                  <th key={s} className="px-3 py-1.5 font-mono text-slate-400">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SEGS.map((r) => (
                <tr key={r}>
                  <th className="px-3 py-1.5 text-left font-mono text-slate-400">{r}</th>
                  {SEGS.map((c) => {
                    const pair = PAIRS.find(([a, b]) => (a === r && b === c) || (a === c && b === r));
                    if (r === c) return <td key={c} className="px-3 py-1.5 text-center text-slate-600">self</td>;
                    if (!pair) return <td key={c} />;
                    const k = key(pair[0], pair[1]);
                    const on = allow[k];
                    return (
                      <td key={c} className="px-1 py-1">
                        <button
                          aria-label={`${pair[0]} to ${pair[1]}: ${on ? 'allowed' : 'denied'}`}
                          onClick={() => { setAllow((s) => ({ ...s, [k]: !s[k] })); setRes(null); }}
                          className={`w-16 rounded border px-2 py-1 font-mono font-bold ${on ? 'border-emerald/60 bg-emerald/15 text-emerald' : 'border-rose-500/60 bg-rose-500/10 text-rose-300'}`}
                        >
                          {on ? 'ALLOW' : 'DENY'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Btn variant="cyan" onClick={run}>
          <Play className="h-4 w-4" /> Run connectivity tests
        </Btn>
        {res && (
          <ul className="space-y-1">
            {res.map((r) => (
              <li key={key(r.a, r.b)} className={`rounded border px-2 py-1 text-xs ${r.want === r.got ? 'border-line text-slate-300' : 'border-rose-500/60 bg-rose-500/10 text-rose-200'}`}>
                <span className="font-mono">{r.a} ↔ {r.b}</span>: {r.got ? 'connected' : 'isolated'}
                {r.want !== r.got && <span> · {r.why}</span>}
              </li>
            ))}
          </ul>
        )}
        {pass && <Callout tone="ok" icon={CheckCircle2}>Least-privilege segmentation: everything reaches shared services, prod reaches only the PCI tokenizer, and dev is fenced off from both prod and PCI. PCI audit scope just shrank.</Callout>}
      </div>
    </ConsoleFrame>
  );
}

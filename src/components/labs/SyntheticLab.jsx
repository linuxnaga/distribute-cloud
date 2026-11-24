import { Activity, CheckCircle2, Loader2, Play, Wrench } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { Btn, Callout, ConsoleFrame, Field, inputCls } from '../ui.jsx';

const LOCATIONS = [
  { id: 'ash', name: 'Ashburn, US', ms: 38 },
  { id: 'fra', name: 'Frankfurt, DE', ms: 44 },
  { id: 'sin', name: 'Singapore, SG', ms: 52 },
  { id: 'syd', name: 'Sydney, AU', ms: 61, broken: true },
  { id: 'gru', name: 'São Paulo, BR', ms: 71 },
];
const CAUSES = [
  { id: 'origin', label: 'The on-prem origin is down', why: 'Then every location would fail, not just Sydney, and the error would be a 503 from the origin pool.' },
  { id: 'dns', label: 'DNS for shop.acme.com is wrong in Australia', why: 'DNS resolved fine to the Anycast VIP: the request reached the RE and got an HTTP answer.' },
  { id: 'policy', label: 'A Service Policy rule denies requests from AU', why: 'Correct. The 403 body says service_policy_deny and names rule launch-markets-only, which only allows US, DE, SG and BR.' },
  { id: 'tls', label: 'The TLS certificate expired', why: 'An expired cert fails the TLS handshake everywhere; it would never produce an HTTP 403.' },
];

export default function SyntheticLab() {
  const { state, award, emit } = useGame();
  const [locs, setLocs] = useState(['ash', 'fra', 'sin', 'syd']);
  const [ran, setRan] = useState(null);
  const [running, setRunning] = useState(false);
  const [cause, setCause] = useState(null);
  const [fixed, setFixed] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const run = () => {
    setRunning(true);
    timer.current = setTimeout(() => {
      setRunning(false);
      const res = LOCATIONS.filter((l) => locs.includes(l.id)).map((l) => ({ ...l, ok: !(l.broken && !fixed) }));
      setRan(res);
      if (fixed && res.some((r) => r.id === 'syd') && res.every((r) => r.ok)) {
        award('m4.synth');
        emit('synth.green');
      }
    }, 1200);
  };
  const sydFail = ran?.some((r) => r.id === 'syd' && !r.ok);
  const picked = CAUSES.find((c) => c.id === cause);

  return (
    <ConsoleFrame crumbs={['Observability', 'Synthetic Monitors', 'shop-healthz']} activeNav="Service Graph" namespace={state.sim.namespace || 'acme-shop'}>
      <div className="space-y-3">
        <Callout tone="info" icon={Activity}>
          Synthetic monitors probe your app from F5 locations worldwide on a schedule, so you find regional breakage before customers do. The Australian launch went live this morning.
        </Callout>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Monitor type">
            <input className={inputCls} value="HTTP(S) · GET" disabled />
          </Field>
          <Field label="Target URL">
            <input className={inputCls} value="https://shop.acme.com/healthz" disabled />
          </Field>
          <div className="sm:col-span-2">
            <Field group label="Probe locations" hint="Tip: include every market you serve.">
              <div className="flex flex-wrap gap-1.5">
                {LOCATIONS.map((l) => (
                  <label key={l.id} className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${locs.includes(l.id) ? 'border-cyan text-cyan' : 'border-line text-slate-400'}`}>
                    <input type="checkbox" className="accent-cyan-500" checked={locs.includes(l.id)} onChange={(e) => setLocs((s) => (e.target.checked ? [...s, l.id] : s.filter((x) => x !== l.id)))} />
                    {l.name}
                  </label>
                ))}
              </div>
            </Field>
          </div>
        </div>
        <Btn variant="cyan" onClick={run} disabled={running || !locs.length}>
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Run monitor now
        </Btn>
        {ran && (
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-xs">
              <thead className="bg-panel2 text-slate-400">
                <tr>
                  <th className="px-2 py-1.5 text-left">Location</th>
                  <th className="px-2 py-1.5">Status</th>
                  <th className="px-2 py-1.5 text-right">Total time</th>
                  <th className="px-2 py-1.5 text-left">Response</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {ran.map((r) => (
                  <tr key={r.id} className={`border-t border-line ${r.ok ? '' : 'bg-rose-500/10'}`}>
                    <td className="px-2 py-1.5 font-sans text-white">{r.name}</td>
                    <td className={`px-2 py-1.5 text-center font-bold ${r.ok ? 'text-emerald' : 'text-rose-400'}`}>{r.ok ? '200' : '403'}</td>
                    <td className="px-2 py-1.5 text-right text-slate-300">{r.ms} ms</td>
                    <td className="px-2 py-1.5 text-slate-400">{r.ok ? '{"status":"ok"}' : '{"error":"service_policy_deny","rule":"launch-markets-only"}'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {ran && !ran.some((r) => r.id === 'syd') && !fixed && <Callout tone="warn">Every probe is green, but you are not testing the market that launched today. Add Sydney.</Callout>}
        {sydFail && (
          <section className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">What is the root cause?</h4>
            {CAUSES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCause(c.id)}
                className={`w-full rounded-lg border p-2 text-left text-sm text-white ${cause === c.id ? (c.id === 'policy' ? 'border-emerald bg-emerald/10' : 'border-rose-500 bg-rose-500/10') : 'border-line hover:border-slate-500'}`}
              >
                {c.label}
              </button>
            ))}
            {picked && <Callout tone={picked.id === 'policy' ? 'ok' : 'bad'}>{picked.why}</Callout>}
            {cause === 'policy' && (
              <Btn
                onClick={() => {
                  setFixed(true);
                  setRan(null);
                }}
              >
                <Wrench className="h-4 w-4" /> Add AU to rule launch-markets-only, then re-run
              </Btn>
            )}
          </section>
        )}
        {fixed && ran?.every((r) => r.ok) && ran.some((r) => r.id === 'syd') && (
          <Callout tone="ok" icon={CheckCircle2}>
            All locations green. The monitor will now alert if any market breaks again, before a customer opens a ticket.
          </Callout>
        )}
      </div>
    </ConsoleFrame>
  );
}

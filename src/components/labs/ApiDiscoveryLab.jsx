import { CheckCircle2, FileCode2, Loader2, Radar, ShieldAlert, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { Btn, Callout, ConsoleFrame, Segmented, StepPill } from '../ui.jsx';

const ENDPOINTS = [
  { path: 'GET /api/v1/catalog', calls: 182400, auth: true, pii: false, spec: true },
  { path: 'GET /api/v1/catalog/{id}', calls: 96100, auth: true, pii: false, spec: true },
  { path: 'POST /api/v1/cart', calls: 41200, auth: true, pii: false, spec: true },
  { path: 'POST /api/v1/orders', calls: 12800, auth: true, pii: true, spec: true },
  { path: 'POST /api/v1/login', calls: 30400, auth: false, pii: true, spec: true },
  { path: 'POST /api/v2/cart', calls: 8800, auth: true, pii: false, spec: false, verdict: 'add', story: 'Owned by the cart team. New version rolled out last sprint, authenticated, same schema as v1 plus coupons.' },
  { path: 'GET /api/v1/admin/export', calls: 312, auth: false, pii: true, spec: false, verdict: 'block', story: 'No authentication, returns full customer records (email, address). Nobody owns it. Classic shadow API.' },
  { path: 'GET /api/internal/debug/vars', calls: 57, auth: false, pii: false, spec: false, verdict: 'block', story: 'Leftover debug endpoint from a dev build. Leaks env vars and config.' },
  { path: 'POST /api/v1/coupons/validate', calls: 6400, auth: true, pii: false, spec: false, verdict: 'add', story: 'Marketing launched it for the holiday promo. Authenticated and rate-limited; it simply never made it into the spec.' },
];

export default function ApiDiscoveryLab() {
  const { state, award, emit } = useGame();
  const [step, setStep] = useState(0);
  const [found, setFound] = useState(0);
  const [specUploaded, setSpecUploaded] = useState(false);
  const [decisions, setDecisions] = useState({});
  const [mode, setMode] = useState('report');
  const [probe, setProbe] = useState(null);
  const t = useRef(null);
  useEffect(() => () => clearInterval(t.current), []);

  const discover = () => {
    setFound(0);
    clearInterval(t.current);
    t.current = setInterval(() => {
      setFound((f) => {
        if (f + 1 >= ENDPOINTS.length) clearInterval(t.current);
        return Math.min(ENDPOINTS.length, f + 1);
      });
    }, 280);
  };
  const shadows = ENDPOINTS.filter((e) => !e.spec);
  const triageDone = shadows.every((e) => decisions[e.path] === e.verdict);

  const sendProbe = () => {
    const blocked = mode === 'block' && triageDone;
    setProbe(blocked);
    if (blocked) {
      award('m3.oas');
      emit('oas.enforced');
    }
  };

  return (
    <ConsoleFrame crumbs={['Web App & API Protection', 'API Security', 'shop-lb', 'API Discovery & Protection']} activeNav="API Security" namespace={state.sim.namespace || 'acme-shop'}>
      <div className="mb-4 flex flex-wrap gap-2">
        {['Discover', 'Upload OAS & triage', 'Enforce'].map((l, i) => (
          <StepPill key={l} n={i + 1} label={l} state={[found === ENDPOINTS.length, specUploaded && triageDone, probe === true][i] ? 'done' : step === i ? 'active' : 'todo'} onClick={() => setStep(i)} />
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-3">
          <Callout tone="info" icon={Radar}>
            API Discovery learns endpoints from live traffic through the HTTP LB, including auth state and sensitive data in responses, without any agents on the origin.
          </Callout>
          <div className="flex gap-2">
            <Btn variant="cyan" onClick={discover}>
              <Radar className="h-4 w-4" /> Enable API Discovery
            </Btn>
            {found === ENDPOINTS.length && (
              <Btn variant="ghost" onClick={() => setStep(1)}>
                Next: upload spec →
              </Btn>
            )}
          </div>
          <EndpointTable rows={ENDPOINTS.slice(0, found)} specUploaded={false} />
          {found > 0 && found < ENDPOINTS.length && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Learning from traffic…
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          {found < ENDPOINTS.length ? (
            <Callout tone="warn">Run discovery first.</Callout>
          ) : (
            <>
              <Btn variant={specUploaded ? 'ghost' : 'cyan'} onClick={() => setSpecUploaded(true)}>
                <Upload className="h-4 w-4" /> {specUploaded ? 'openapi-v3.1.json uploaded' : 'Upload openapi-v3.1.json'}
              </Btn>
              {specUploaded && (
                <>
                  <EndpointTable rows={ENDPOINTS} specUploaded />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Triage {shadows.length} shadow endpoints</h4>
                  {shadows.map((e) => {
                    const d = decisions[e.path];
                    return (
                      <div key={e.path} className="rounded-lg border border-line bg-panel/60 p-2.5">
                        <div className="font-mono text-xs text-amber-300">{e.path}</div>
                        <p className="mt-1 text-xs text-slate-400">{e.story}</p>
                        <div className="mt-2 flex gap-1.5">
                          {[
                            ['add', 'Add to spec'],
                            ['block', 'Block'],
                          ].map(([v, l]) => (
                            <button
                              key={v}
                              onClick={() => setDecisions((s) => ({ ...s, [e.path]: v }))}
                              className={`rounded-md border px-2 py-1 text-xs font-semibold ${d === v ? (v === e.verdict ? 'border-emerald bg-emerald/15 text-emerald' : 'border-rose-500 bg-rose-500/15 text-rose-300') : 'border-line text-slate-400 hover:text-white'}`}
                            >
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {triageDone && (
                    <Btn variant="ghost" onClick={() => setStep(2)}>
                      Next: enforce →
                    </Btn>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          {!triageDone ? (
            <Callout tone="warn">Finish triaging the shadow endpoints first.</Callout>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-2.5">
                <div>
                  <div className="text-sm font-semibold text-white">OpenAPI validation · fall-through (undocumented) endpoints</div>
                  <div className="text-xs text-slate-400">What happens to calls that match no path in the spec</div>
                </div>
                <Segmented
                  value={mode}
                  onChange={(v) => {
                    setMode(v);
                    setProbe(null);
                  }}
                  options={[
                    { value: 'report', label: 'Report', color: '#f59e0b' },
                    { value: 'block', label: 'Block', color: '#10b981' },
                  ]}
                />
              </div>
              <Btn onClick={sendProbe}>
                <ShieldAlert className="h-4 w-4" /> Replay scanner probe: GET /api/v1/admin/export
              </Btn>
              {probe === false && <Callout tone="warn">Report mode logged the violation, but the probe still received HTTP 200 with customer data. Switch fall-through to Block.</Callout>}
              {probe === true && (
                <Callout tone="ok" icon={CheckCircle2}>
                  HTTP 403 at the Regional Edge: <span className="font-mono">api_protection: endpoint not in OAS</span>. Documented APIs (including the two you added) keep working, while unknown ones are dropped.
                </Callout>
              )}
            </>
          )}
        </div>
      )}
    </ConsoleFrame>
  );
}

function EndpointTable({ rows, specUploaded }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-xs">
        <thead className="bg-panel2 text-slate-400">
          <tr>
            <th className="px-2 py-1.5 text-left">Endpoint</th>
            <th className="px-2 py-1.5 text-right">Calls/24h</th>
            <th className="px-2 py-1.5">Auth</th>
            <th className="px-2 py-1.5">Sensitive data</th>
            <th className="px-2 py-1.5">Inventory</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((e) => (
            <tr key={e.path} className="toast-in border-t border-line">
              <td className="px-2 py-1.5 text-slate-200">{e.path}</td>
              <td className="px-2 py-1.5 text-right text-slate-400">{e.calls.toLocaleString()}</td>
              <td className={`px-2 py-1.5 text-center ${e.auth ? 'text-emerald' : 'text-rose-400'}`}>{e.auth ? 'yes' : 'none'}</td>
              <td className={`px-2 py-1.5 text-center ${e.pii ? 'text-amber-300' : 'text-slate-500'}`}>{e.pii ? 'PII' : '—'}</td>
              <td className="px-2 py-1.5 text-center">
                {specUploaded ? (
                  e.spec ? (
                    <span className="text-emerald">
                      <FileCode2 className="mr-0.5 inline h-3 w-3" />
                      in spec
                    </span>
                  ) : (
                    <span className="font-bold text-amber-300">SHADOW</span>
                  )
                ) : (
                  <span className="text-slate-500">discovered</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

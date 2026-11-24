import { Bot, Flame, Lightbulb, Play, ScanSearch, Shield, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { ATTACKS, blockFraction, runBurst } from '../../sim/security.js';
import { Btn, Callout, ConsoleFrame, Segmented, Toggle } from '../ui.jsx';

const ICON = { sqli: ScanSearch, bot: Bot, ddos: Flame, api: ScanSearch };

const LOG_TEMPLATES = {
  sqli: (blocked) => `[app_firewall] sig_id=200002835 "SQL-INJ OR 1=1" attack_type=ATTACK_TYPE_SQL_INJECTION action=${blocked ? 'block' : 'allow'} src=185.220.101.${Math.floor(Math.random() * 200)}`,
  bot: (blocked) => `[bot_defense] POST /login automation_type=CREDENTIAL_STUFFING score=0.97 action=${blocked ? 'block' : 'allow'} asn=AS9009`,
  ddos: (blocked) => `[l7_ddos] /checkout rps=48211 threshold=200/client action=${blocked ? 'rate_limit+js_challenge' : 'none'}`,
  api: (blocked) => `[api_protection] GET /api/v1/admin/export endpoint=SHADOW (not in OAS v3.1) action=${blocked ? 'block' : 'allow'}`,
};

function hintFor(sec, burst) {
  const hints = [];
  const leak = (id) => burst.attacks.find((a) => a.id === id)?.leaked > 0;
  if (sec.policy === 'denyall') hints.push('Deny-all "stops" every attack, but it also rejects ~97% of real shoppers. Service Policies are for allow-lists on private or admin apps, not public storefronts.');
  if (leak('sqli')) hints.push(sec.waf === 'monitor' ? 'App Firewall is in Monitoring mode: it logged every SQLi hit but forwarded them. Switch to Blocking.' : 'SQLi is a signature attack. Turn on App Firewall in Blocking mode.');
  if (leak('bot')) hints.push('Credential stuffing uses valid-looking logins, so WAF signatures miss most of it. Enable Bot Defense on POST /login.');
  if (leak('ddos')) hints.push('The flood is saturating the origin and real users are timing out. Enable L7 DDoS protection (rate limiting + JS challenge).');
  if (leak('api')) hints.push('/api/v1/admin/export is not in your OpenAPI spec. Enable API Discovery with OAS enforcement to block shadow endpoints.');
  return hints;
}

export default function AttackLab() {
  const { state, updateSim, award, emit } = useGame();
  const sim = state.sim;
  const sec = sim.security;
  const [include, setInclude] = useState({ sqli: true, bot: true, ddos: true, api: true });
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState([]);
  const timer = useRef(null);
  useEffect(() => () => clearInterval(timer.current), []);

  const setSec = (patch) => updateSim((x) => ({ ...x, security: { ...x.security, ...patch } }));

  const launch = () => {
    setRunning(true);
    setProgress(0);
    setLog([]);
    const active = ATTACKS.filter((a) => include[a.id]);
    let t = 0;
    timer.current = setInterval(() => {
      t += 1;
      setProgress(t * 5);
      const a = active[t % active.length];
      if (a) setLog((l) => [...l.slice(-7), LOG_TEMPLATES[a.id](Math.random() < blockFraction(sec, a.id))]);
      if (t >= 20) {
        clearInterval(timer.current);
        const result = runBurst(sec);
        result.attacks = result.attacks.filter((x) => include[x.id]);
        const all = active.length === ATTACKS.length;
        result.clean = result.clean && all;
        updateSim({ lastBurst: result });
        // A deny-all policy "blocks" attacks by blocking everyone, so it earns nothing.
        for (const r of result.attacks) {
          if (r.leaked === 0 && sec.policy !== 'denyall') {
            award(`m3.${r.id}`);
            emit(`attack.blocked:${r.id}`);
          }
        }
        if (result.clean) {
          award('m3.clean');
          emit('burst.clean');
        }
        setRunning(false);
      }
    }, 150);
  };

  const burst = sim.lastBurst;
  const hints = burst && !running ? hintFor(sec, burst) : [];

  return (
    <ConsoleFrame crumbs={['Web App & API Protection', 'Load Balancers', 'shop-lb', 'Security Configuration']} activeNav="App Firewall" namespace={sim.namespace || 'acme-shop'}>
      <div className="grid gap-4 2xl:grid-cols-2">
        <section className="space-y-2">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Shield className="h-4 w-4 text-amber-400" /> HTTP LB security controls
          </h3>
          <div className="rounded-lg border border-line p-2.5">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-white">App Firewall</span>
              <Segmented
                value={sec.waf}
                onChange={(v) => setSec({ waf: v })}
                options={[
                  { value: 'off', label: 'Off', color: '#64748b' },
                  { value: 'monitor', label: 'Monitoring', color: '#f59e0b' },
                  { value: 'block', label: 'Blocking', color: '#10b981' },
                ]}
              />
            </div>
            <p className="text-xs text-slate-400">Signature + threat campaign WAF. High & medium accuracy signatures.</p>
          </div>
          <Toggle on={sec.bot} onChange={(v) => setSec({ bot: v })} label="Bot Defense" desc="Protected endpoint: POST /login · Mitigation: Block" color="#f59e0b" />
          <Toggle on={sec.ddos} onChange={(v) => setSec({ ddos: v })} label="L7 DDoS Protection" desc="Rate limit 200 rps/client · auto-mitigation with JS challenge" color="#fb7185" />
          <Toggle on={sec.api} onChange={(v) => setSec({ api: v })} label="API Discovery + OAS Enforcement" desc="Validate against openapi-v3.1.json · block undocumented endpoints" color="#e879f9" />
          <div className="rounded-lg border border-line p-2.5">
            <div className="mb-1.5 text-sm font-semibold text-white">Service Policy</div>
            <Segmented
              value={sec.policy}
              onChange={(v) => setSec({ policy: v })}
              options={[
                { value: 'none', label: 'None', color: '#64748b' },
                { value: 'ipRep', label: 'Block IP reputation & TOR', color: '#06b6d4' },
                { value: 'denyall', label: 'Deny all but corp /24', color: '#f43f5e' },
              ]}
            />
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Flame className="h-4 w-4 text-rose-400" /> Traffic burst generator
          </h3>
          <div className="grid grid-cols-2 gap-1.5">
            {ATTACKS.map((a) => {
              const I = ICON[a.id];
              return (
                <label key={a.id} className={`flex cursor-pointer items-start gap-2 rounded-md border p-2 text-xs ${include[a.id] ? 'border-rose-500/50 bg-rose-500/5' : 'border-line opacity-60'}`}>
                  <input type="checkbox" className="mt-0.5 accent-rose-500" checked={include[a.id]} onChange={(e) => setInclude((s) => ({ ...s, [a.id]: e.target.checked }))} />
                  <span>
                    <span className="flex items-center gap-1 font-semibold text-white">
                      <I className="h-3.5 w-3.5" style={{ color: a.color }} /> {a.name}
                    </span>
                    <span className="block font-mono text-[10px] text-slate-500">{a.detail}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <div className="flex items-center gap-2 rounded-md border border-line p-2 text-xs text-slate-400">
            <Users className="h-4 w-4 text-cyan" /> Plus 9,000 legitimate shopper requests mixed in.
          </div>
          <Btn onClick={launch} disabled={running || !Object.values(include).some(Boolean)} className="w-full">
            <Play className="h-4 w-4" /> {running ? 'Burst in progress…' : 'Launch traffic burst'}
          </Btn>
          {running && (
            <div className="h-1.5 overflow-hidden rounded-full bg-panel2">
              <div className="h-full bg-rose-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          <div className="h-36 overflow-hidden rounded-lg border border-line bg-black/60 p-2 font-mono text-[10.5px] leading-relaxed" aria-live="polite">
            {log.length === 0 && <span className="text-slate-600">Security event stream (RE ashburn-re-1)…</span>}
            {log.map((l, i) => (
              <div key={i} className={`truncate ${l.includes('action=allow') || l.includes('action=none') ? 'text-rose-400' : 'text-emerald'}`}>
                {l}
              </div>
            ))}
          </div>
        </section>
      </div>

      {burst && !running && (
        <section className="mt-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Last burst results</h3>
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-xs">
              <thead className="bg-panel2 text-slate-400">
                <tr>
                  <th className="px-2 py-1.5 text-left">Traffic</th>
                  <th className="px-2 py-1.5 text-right">Sent</th>
                  <th className="px-2 py-1.5 text-right">Dropped at RE</th>
                  <th className="px-2 py-1.5 text-right">Reached origin</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {burst.attacks.map((r) => {
                  const a = ATTACKS.find((x) => x.id === r.id);
                  return (
                    <tr key={r.id} className="border-t border-line">
                      <td className="px-2 py-1.5 font-sans text-white">{a.name}</td>
                      <td className="px-2 py-1.5 text-right text-slate-300">{r.sent.toLocaleString()}</td>
                      <td className="px-2 py-1.5 text-right text-emerald">{r.blocked.toLocaleString()}</td>
                      <td className={`px-2 py-1.5 text-right ${r.leaked ? 'font-bold text-rose-400' : 'text-slate-500'}`}>
                        {r.leaked.toLocaleString()}
                        {r.detected ? <span className="ml-1 text-amber-300">(logged)</span> : null}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t border-line bg-cyan/5">
                  <td className="px-2 py-1.5 font-sans text-cyan">Legit shoppers</td>
                  <td className="px-2 py-1.5 text-right text-slate-300">{burst.legit.sent.toLocaleString()}</td>
                  <td colSpan={2} className={`px-2 py-1.5 text-right font-bold ${burst.legit.rate >= 0.95 ? 'text-emerald' : 'text-rose-400'}`}>
                    {(burst.legit.rate * 100).toFixed(1)}% success
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {burst.clean ? (
            <Callout tone="ok" icon={ShieldCheck}>
              Clean run. Every attack died at the Regional Edge and shoppers kept checking out. The origin and the tunnels never saw the malicious load.
            </Callout>
          ) : (
            hints.map((h) => (
              <Callout key={h} tone="warn" icon={Lightbulb}>
                {h}
              </Callout>
            ))
          )}
          {!burst.clean && burst.attacks.length < ATTACKS.length && hints.length === 0 && <Callout tone="info">Include all four attacks in a burst to attempt a clean run.</Callout>}
        </section>
      )}
    </ConsoleFrame>
  );
}

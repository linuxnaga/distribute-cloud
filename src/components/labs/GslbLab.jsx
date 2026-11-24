import { CheckCircle2, Globe, Play } from 'lucide-react';
import { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { Btn, Callout, ConsoleFrame, Field, Toggle, inputCls } from '../ui.jsx';

const POOLS = { us: 'us-pool · 159.60.141.18 (AWS us-east-1 LB)', eu: 'eu-pool · 159.60.142.40 (Azure westeurope LB)' };
const CLIENTS = [
  { city: 'New York', near: 'us' },
  { city: 'Berlin', near: 'eu' },
  { city: 'São Paulo', near: 'us' },
];

function resolve(cfg, city, euDown) {
  const near = CLIENTS.find((c) => c.city === city).near;
  let pick;
  if (cfg.policy === 'rr') pick = city === 'Berlin' ? 'us' : 'eu';
  else if (cfg.policy === 'failover') pick = 'us';
  else pick = near;
  if (euDown && pick === 'eu' && cfg.health) pick = 'us';
  const dead = euDown && pick === 'eu';
  return { pick, dead };
}

export default function GslbLab() {
  const { award, emit } = useGame();
  const [cfg, setCfg] = useState({ policy: 'rr', health: false, ttl: '3600' });
  const [res, setRes] = useState(null);
  const set = (k, v) => {
    setCfg((c) => ({ ...c, [k]: v }));
    setRes(null);
  };

  const run = () => {
    const rows = [];
    for (const euDown of [false, true]) {
      for (const c of CLIENTS) {
        const r = resolve(cfg, c.city, euDown);
        const expected = euDown && c.near === 'eu' ? 'us' : c.near;
        rows.push({ scenario: euDown ? 'eu-pool outage' : 'normal', city: c.city, ...r, ok: r.pick === expected && !r.dead, expected });
      }
    }
    const ttlOk = Number(cfg.ttl) <= 60;
    setRes({ rows, ttlOk });
    if (rows.every((r) => r.ok) && ttlOk) {
      award('m2.gslb');
      emit('gslb.pass');
    }
  };

  const pass = res && res.ttlOk && res.rows.every((r) => r.ok);

  return (
    <ConsoleFrame crumbs={['DNS Management', 'DNS Load Balancers', 'shop.acme.com']} activeNav="Load Balancers" namespace="acme-shop">
      <div className="space-y-3">
        <Callout tone="info" icon={Globe}>
          The storefront now runs in two regions, each behind its own HTTP LB. Use F5 XC DNS load balancing so each shopper resolves to the <b>nearest healthy</b> region, and recovers within a minute if a region fails.
        </Callout>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Load balancing policy">
            <select className={inputCls} value={cfg.policy} onChange={(e) => set('policy', e.target.value)}>
              <option value="rr">Round robin</option>
              <option value="failover">Priority failover (us-pool primary)</option>
              <option value="geo">Geo-proximity</option>
            </select>
          </Field>
          <Field label="Record TTL (seconds)">
            <select className={inputCls} value={cfg.ttl} onChange={(e) => set('ttl', e.target.value)}>
              <option value="3600">3600</option>
              <option value="300">300</option>
              <option value="30">30</option>
            </select>
          </Field>
        </div>
        <Toggle on={cfg.health} onChange={(v) => set('health', v)} label="Health checks on pool members" desc="HTTPS GET /healthz every 10s; unhealthy members are removed from DNS answers" />
        <div className="rounded-lg border border-line p-2 font-mono text-[11px] text-slate-400">
          {Object.values(POOLS).map((p) => (
            <div key={p}>{p}</div>
          ))}
        </div>
        <Btn variant="cyan" onClick={run}>
          <Play className="h-4 w-4" /> Resolve from 3 cities, then fail eu-pool
        </Btn>
        {res && (
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-xs">
              <thead className="bg-panel2 text-slate-400">
                <tr>
                  <th className="px-2 py-1.5 text-left">Scenario</th>
                  <th className="px-2 py-1.5 text-left">Client</th>
                  <th className="px-2 py-1.5">Answer</th>
                  <th className="px-2 py-1.5">Expected</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {res.rows.map((r, i) => (
                  <tr key={i} className={`border-t border-line ${r.ok ? '' : 'bg-rose-500/10'}`}>
                    <td className="px-2 py-1.5 text-slate-400">{r.scenario}</td>
                    <td className="px-2 py-1.5 font-sans text-white">{r.city}</td>
                    <td className={`px-2 py-1.5 text-center ${r.ok ? 'text-emerald' : 'font-bold text-rose-400'}`}>{r.pick}-pool{r.dead ? ' (DOWN)' : ''}</td>
                    <td className="px-2 py-1.5 text-center text-slate-400">{r.expected}-pool</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {res && !res.ttlOk && <Callout tone="warn">With a TTL of {cfg.ttl}s, resolvers keep handing out the dead eu-pool address long after it fails. Drop the TTL to 60s or less.</Callout>}
        {res && res.rows.some((r) => !r.ok) && <Callout tone="warn">Some answers are wrong. Nearest-region routing needs geo-proximity, and only health checks let DNS stop answering with a failed pool.</Callout>}
        {pass && <Callout tone="ok" icon={CheckCircle2}>Geo-proximity sends each shopper to the closest region, health checks pull eu-pool out of answers when it fails, and a 30s TTL means clients follow within seconds.</Callout>}
      </div>
    </ConsoleFrame>
  );
}

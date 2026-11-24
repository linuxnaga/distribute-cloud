import { CheckCircle2, Gauge, Play } from 'lucide-react';
import { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { Btn, Callout, ConsoleFrame, inputCls } from '../ui.jsx';

const PATHS = [
  { path: '/assets/*', what: 'Versioned JS, CSS and images (file names change on every release)', share: 0.55, want: (t) => t >= 86400, note: 'Versioned assets never change in place: cache them for a long time.' },
  { path: '/catalog/*', what: 'Product pages; prices can change several times a day', share: 0.3, want: (t) => t > 0 && t <= 300, note: 'Short TTL: big offload, and a price change shows up within minutes.' },
  { path: '/cart', what: 'The signed-in user\'s cart', share: 0.1, want: (t) => t === 0, note: 'Personal data must never be cached at a shared edge.' },
  { path: '/api/v1/orders', what: 'Order history and checkout API', share: 0.05, want: (t) => t === 0, note: 'Personal, transactional data: bypass the cache.' },
];
const TTLS = [
  { v: 0, l: 'Bypass cache' },
  { v: 60, l: '60 s' },
  { v: 3600, l: '1 hour' },
  { v: 86400, l: '1 day' },
];

export default function CdnLab() {
  const { award, emit } = useGame();
  const [ttl, setTtl] = useState({ '/assets/*': 0, '/catalog/*': 0, '/cart': 0, '/api/v1/orders': 0 });
  const [res, setRes] = useState(null);

  const run = () => {
    const hit = PATHS.reduce((s, p) => s + p.share * (ttl[p.path] === 0 ? 0 : ttl[p.path] >= 3600 ? 0.97 : 0.85), 0);
    const leak = PATHS.filter((p) => p.share <= 0.1 && ttl[p.path] > 0).map((p) => p.path);
    const stale = ttl['/catalog/*'] >= 3600;
    const ok = PATHS.every((p) => p.want(ttl[p.path]));
    setRes({ hit, leak, stale, ok });
    if (ok) {
      award('m4.cdn');
      emit('cdn.pass');
    }
  };

  return (
    <ConsoleFrame crumbs={['Distributed Apps', 'CDN Distributions', 'shop-cdn', 'Cache Rules']} activeNav="Virtual Sites" namespace="acme-shop">
      <div className="space-y-3">
        <Callout tone="info" icon={Gauge}>
          Turn on edge caching for <span className="font-mono">shop.acme.com</span> to offload the on-prem origin before the holiday peak. Pick a TTL per path; then run a load test.
        </Callout>
        <div className="space-y-2">
          {PATHS.map((p) => (
            <div key={p.path} className="grid items-center gap-2 rounded-lg border border-line bg-panel/60 p-2.5 sm:grid-cols-[1fr_160px]">
              <div>
                <div className="font-mono text-sm text-white">{p.path}</div>
                <div className="text-xs text-slate-400">
                  {p.what} · {Math.round(p.share * 100)}% of requests
                </div>
                {res && !p.want(ttl[p.path]) && <div className="mt-1 text-[11px] text-rose-300">{p.note}</div>}
              </div>
              <select aria-label={`TTL for ${p.path}`} className={inputCls} value={ttl[p.path]} onChange={(e) => { setTtl((s) => ({ ...s, [p.path]: Number(e.target.value) })); setRes(null); }}>
                {TTLS.map((t) => (
                  <option key={t.v} value={t.v}>
                    {t.l}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <Btn variant="cyan" onClick={run}>
          <Play className="h-4 w-4" /> Run 10-minute load test
        </Btn>
        {res && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-line bg-ink p-2">
              <div className="text-[10px] uppercase text-slate-500">Edge hit ratio</div>
              <div className="font-mono text-lg font-bold text-white">{Math.round(res.hit * 100)}%</div>
            </div>
            <div className="rounded-lg border border-line bg-ink p-2">
              <div className="text-[10px] uppercase text-slate-500">Origin requests</div>
              <div className="font-mono text-lg font-bold text-white">{Math.round((1 - res.hit) * 1200)}/s</div>
            </div>
            <div className={`rounded-lg border p-2 ${res.leak.length ? 'border-rose-500 bg-rose-500/10' : 'border-line bg-ink'}`}>
              <div className="text-[10px] uppercase text-slate-500">Data leaks</div>
              <div className={`font-mono text-lg font-bold ${res.leak.length ? 'text-rose-400' : 'text-emerald'}`}>{res.leak.length}</div>
            </div>
          </div>
        )}
        {res?.leak.length > 0 && <Callout tone="bad">Shopper B was served shopper A's {res.leak.join(' and ')} response from the edge cache. Personal responses must bypass the cache.</Callout>}
        {res?.stale && <Callout tone="warn">The marketing team cut prices, but /catalog keeps serving old prices for up to an hour. Use a short TTL (or purge on change).</Callout>}
        {res && !res.ok && !res.leak.length && !res.stale && <Callout tone="warn">No leaks, but the origin is still doing work the edge could do. Cache the static and catalog paths.</Callout>}
        {res?.ok && <Callout tone="ok" icon={CheckCircle2}>Most requests are now served from the edge with no stale prices and no personal data in the cache. The on-prem origin only sees cart and checkout traffic.</Callout>}
      </div>
    </ConsoleFrame>
  );
}

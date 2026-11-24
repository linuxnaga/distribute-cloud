import { CheckCircle2, Code2, Play } from 'lucide-react';
import { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { Btn, Callout, ConsoleFrame, Segmented, Toggle } from '../ui.jsx';

const SCRIPTS = [
  { src: 'https://shop.acme.com/static/app.4f2c.js', talks: 'shop.acme.com', reads: 'cart, form state', bad: false },
  { src: 'https://js.stripe.com/v3/', talks: 'api.stripe.com', reads: 'card fields (in Stripe iframe)', bad: false },
  { src: 'https://www.googletagmanager.com/gtm.js', talks: 'www.google-analytics.com', reads: 'page views', bad: false },
  { src: 'https://cdn.jsdelivr.net/npm/jquery@3.7.1', talks: '—', reads: 'DOM', bad: false },
  { src: 'https://acme-cdn-assets.top/sync.js', talks: 'collect.acme-cdn-assets.top', reads: 'card number, CVV, name on card', bad: true },
];

export default function ClientSideLab() {
  const { award, emit } = useGame();
  const [enabled, setEnabled] = useState(false);
  const [decisions, setDecisions] = useState({});
  const [mode, setMode] = useState('monitor');
  const [res, setRes] = useState(null);

  const run = () => {
    const wrong = SCRIPTS.filter((s) => (decisions[s.src] || 'allow') !== (s.bad ? 'block' : 'allow'));
    const pass = enabled && wrong.length === 0 && mode === 'mitigate';
    setRes({ wrong, pass });
    if (pass) {
      award('m3.csd');
      emit('csd.pass');
    }
  };

  return (
    <ConsoleFrame crumbs={['Web App & API Protection', 'Client-Side Defense', 'shop-lb', 'Script Inventory']} activeNav="Bot Defense" namespace="acme-shop">
      <div className="space-y-3">
        <Callout tone="info" icon={Code2}>
          A card-skimming (Magecart-style) attack runs in the shopper's browser, so the WAF never sees it. Client-Side Defense injects a small JS agent that inventories every script on the page and the domains it sends data to.
        </Callout>
        <Toggle on={enabled} onChange={(v) => { setEnabled(v); setRes(null); }} label="Enable Client-Side Defense on /checkout" desc="Injects the monitoring script via the HTTP LB; no app code change" color="#f59e0b" />
        {enabled && (
          <>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Scripts seen on /checkout (last 24h)</div>
            <div className="space-y-1.5">
              {SCRIPTS.map((s) => {
                const d = decisions[s.src] || 'allow';
                return (
                  <div key={s.src} className="grid items-center gap-2 rounded-lg border border-line bg-panel/60 p-2 sm:grid-cols-[1fr_auto]">
                    <div className="min-w-0">
                      <div className="truncate font-mono text-xs text-white">{s.src}</div>
                      <div className="text-[11px] text-slate-400">
                        Sends data to <span className="font-mono">{s.talks}</span> · reads {s.reads}
                      </div>
                    </div>
                    <Segmented
                      value={d}
                      onChange={(v) => { setDecisions((x) => ({ ...x, [s.src]: v })); setRes(null); }}
                      options={[
                        { value: 'allow', label: 'Allow', color: '#10b981' },
                        { value: 'block', label: 'Block', color: '#f43f5e' },
                      ]}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-2.5">
              <span className="text-sm font-semibold text-white">Policy mode</span>
              <Segmented
                value={mode}
                onChange={(v) => { setMode(v); setRes(null); }}
                options={[
                  { value: 'monitor', label: 'Monitor only', color: '#f59e0b' },
                  { value: 'mitigate', label: 'Mitigate (block exfiltration)', color: '#10b981' },
                ]}
              />
            </div>
          </>
        )}
        <Btn variant="cyan" onClick={run}>
          <Play className="h-4 w-4" /> Replay 100 checkouts
        </Btn>
        {res && !enabled && <Callout tone="bad">Without Client-Side Defense nothing watches the browser. 100 card numbers just went to an unknown domain.</Callout>}
        {res && enabled && res.wrong.length > 0 && (
          <Callout tone="bad">
            {res.wrong.some((s) => s.bad) ? 'The skimmer is still allowed: it reads card fields and posts them to a look-alike domain. ' : ''}
            {res.wrong.some((s) => !s.bad) ? 'You blocked a legitimate script, and checkout broke for some users. ' : ''}
          </Callout>
        )}
        {res && enabled && res.wrong.length === 0 && mode !== 'mitigate' && <Callout tone="warn">The skimmer is flagged, but Monitor mode only reports it: the card data still leaves. Switch to Mitigate.</Callout>}
        {res?.pass && <Callout tone="ok" icon={CheckCircle2}>Exfiltration to collect.acme-cdn-assets.top is blocked in every browser, Stripe and analytics keep working, and the security team has a full script inventory for PCI DSS 6.4.3.</Callout>}
      </div>
    </ConsoleFrame>
  );
}

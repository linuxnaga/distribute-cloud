import { CheckCircle2, Fingerprint, Play } from 'lucide-react';
import { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { Btn, Callout, ConsoleFrame, Field, inputCls } from '../ui.jsx';

const ACTIONS = [
  { id: 'none', label: 'No action' },
  { id: 'js', label: 'JavaScript challenge' },
  { id: 'captcha', label: 'Captcha challenge' },
  { id: 'block', label: 'Temporarily block' },
];
// Each user's risk depends on how users are identified.
const USERS = [
  { id: 'shopper', label: 'Regular shopper (home IP)', risk: { ip: 'low', smart: 'low' }, goal: 'Should shop untouched' },
  { id: 'office', label: '120 employees behind one corporate NAT IP', risk: { ip: 'medium', smart: 'low' }, goal: 'Should shop untouched' },
  { id: 'scraper', label: 'Price scraper (high rate, headless browser)', risk: { ip: 'medium', smart: 'medium' }, goal: 'Should be challenged' },
  { id: 'attacker', label: 'Attacker (WAF violations, forbidden paths, failed logins)', risk: { ip: 'high', smart: 'high' }, goal: 'Should be blocked' },
];
const GOOD = {
  shopper: (a) => a === 'none',
  office: (a) => a === 'none',
  scraper: (a) => a === 'js' || a === 'captcha',
  attacker: (a) => a === 'block',
};

export default function MaliciousUserLab() {
  const { award, emit } = useGame();
  const [ident, setIdent] = useState('ip');
  const [act, setAct] = useState({ low: 'captcha', medium: 'captcha', high: 'captcha' });
  const [res, setRes] = useState(null);

  const run = () => {
    const key = ident === 'ip' ? 'ip' : 'smart';
    const rows = USERS.map((u) => {
      const risk = u.risk[key];
      const action = act[risk];
      return { ...u, risk, action, ok: GOOD[u.id](action) };
    });
    setRes(rows);
    if (rows.every((r) => r.ok)) {
      award('m3.mud');
      emit('mud.pass');
    }
  };
  const pass = res && res.every((r) => r.ok);

  return (
    <ConsoleFrame crumbs={['Web App & API Protection', 'Load Balancers', 'shop-lb', 'Malicious User Detection']} activeNav="Bot Defense" namespace="acme-shop">
      <div className="space-y-3">
        <Callout tone="info" icon={Fingerprint}>
          Malicious User Detection scores each user over time from WAF hits, forbidden requests, failed logins and rate anomalies, then applies a mitigation per threat level. Tune it so the bad actors are stopped and nobody legitimate is challenged.
        </Callout>
        <Field label="User identification">
          <select className={inputCls} value={ident} onChange={(e) => { setIdent(e.target.value); setRes(null); }}>
            <option value="ip">Client IP address</option>
            <option value="tls">Client IP + TLS fingerprint</option>
            <option value="cookie">Session cookie</option>
          </select>
        </Field>
        <div className="grid gap-2 sm:grid-cols-3">
          {['low', 'medium', 'high'].map((lvl) => (
            <Field key={lvl} label={`${lvl[0].toUpperCase() + lvl.slice(1)} threat → action`}>
              <select className={inputCls} value={act[lvl]} onChange={(e) => { setAct((s) => ({ ...s, [lvl]: e.target.value })); setRes(null); }}>
                {ACTIONS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </Field>
          ))}
        </div>
        <Btn variant="cyan" onClick={run}>
          <Play className="h-4 w-4" /> Replay 1 hour of traffic
        </Btn>
        {res && (
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-xs">
              <thead className="bg-panel2 text-slate-400">
                <tr>
                  <th className="px-2 py-1.5 text-left">User</th>
                  <th className="px-2 py-1.5">Threat</th>
                  <th className="px-2 py-1.5">Action taken</th>
                  <th className="px-2 py-1.5 text-left">Goal</th>
                </tr>
              </thead>
              <tbody>
                {res.map((r) => (
                  <tr key={r.id} className={`border-t border-line ${r.ok ? '' : 'bg-rose-500/10'}`}>
                    <td className="px-2 py-1.5 text-slate-200">{r.label}</td>
                    <td className="px-2 py-1.5 text-center font-mono uppercase text-slate-300">{r.risk}</td>
                    <td className={`px-2 py-1.5 text-center font-mono ${r.ok ? 'text-emerald' : 'font-bold text-rose-400'}`}>{ACTIONS.find((a) => a.id === r.action).label}</td>
                    <td className="px-2 py-1.5 text-slate-400">{r.goal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {res && !pass && (
          <Callout tone="warn">
            {ident === 'ip' && res.find((r) => r.id === 'office').risk === 'medium'
              ? 'Identifying users by IP lumps 120 employees into one "user" with a suspicious request rate. Use a TLS fingerprint or session cookie. '
              : ''}
            Low threat should never be challenged, medium should get a challenge, and only high threat should be blocked.
          </Callout>
        )}
        {pass && <Callout tone="ok" icon={CheckCircle2}>Per-user identification keeps the corporate NAT office clean, the scraper is challenged, and the attacker is blocked while real shoppers never notice.</Callout>}
      </div>
    </ConsoleFrame>
  );
}

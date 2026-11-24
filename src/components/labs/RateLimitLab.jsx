import { CheckCircle2, Gauge, Play } from 'lucide-react';
import { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { Btn, Callout, ConsoleFrame } from '../ui.jsx';
import ChoiceGrid, { allOk, initial } from './ChoiceGrid.jsx';

const LIMITS = [['none', 'No limit'], ['10', '10 / min'], ['60', '60 / min'], ['200', '200 / min'], ['1000', '1000 / min']];
const lim = (v) => (v === 'none' ? Infinity : Number(v));
const ITEMS = [
  {
    id: 'key',
    title: 'Count requests per…',
    desc: '50 employees of a wholesale customer shop from behind one office NAT IP.',
    options: [['ip', 'Client IP address'], ['user', 'User (session cookie / login identity)']],
    ok: (v) => v === 'user',
    hint: 'Per-IP limits add up 50 people behind one NAT and throttle them as if they were one abuser.',
  },
  {
    id: 'login',
    title: 'POST /login',
    desc: 'Real users: up to 5/min. Credential stuffer: 300/min per session.',
    options: LIMITS,
    ok: (v) => lim(v) >= 5 && lim(v) < 300 && lim(v) <= 60,
    hint: 'Login needs a tight limit: well above 5/min for humans, far below the attacker. 10/min is typical.',
  },
  {
    id: 'search',
    title: 'GET /api/v1/search',
    desc: 'Real users: up to 40/min. Price scraper: 600/min.',
    options: LIMITS,
    ok: (v) => lim(v) >= 40 && lim(v) < 600,
    hint: 'The limit must sit between 40 (legit peak) and 600 (scraper).',
  },
  {
    id: 'ddos',
    title: 'An 80 Gbps SYN flood hits the Anycast VIP',
    options: [['rl', 'Add an L7 rate limit rule'], ['sp', 'Add a Service Policy deny rule'], ['auto', 'Nothing: the RE network absorbs L3/L4 floods automatically']],
    ok: (v) => v === 'auto',
    hint: 'SYN floods never become HTTP requests, so L7 rules never see them. L3/L4 DDoS is scrubbed by the global network automatically.',
  },
];

export default function RateLimitLab() {
  const { award, emit } = useGame();
  const [vals, setVals] = useState({ ...initial(ITEMS), login: 'none', search: 'none' });
  const [checked, setChecked] = useState(false);
  const ok = allOk(ITEMS, vals);
  const run = () => {
    setChecked(true);
    if (ok) {
      award('m3.ratelimit');
      emit('ratelimit.pass');
    }
  };
  return (
    <ConsoleFrame crumbs={['Web App & API Protection', 'Load Balancers', 'shop-lb', 'Rate Limiting']} activeNav="App Firewall" namespace="acme-shop">
      <div className="space-y-3">
        <Callout tone="info" icon={Gauge}>
          Rate limiting caps how fast a single client can hit an endpoint, at the Regional Edge. Set limits that stop the abusers below without ever throttling a real customer.
        </Callout>
        <ChoiceGrid items={ITEMS} values={vals} checked={checked} onChange={(k, v) => { setVals((s) => ({ ...s, [k]: v })); setChecked(false); }} />
        <Btn variant="cyan" onClick={run}>
          <Play className="h-4 w-4" /> Replay peak traffic + attacks
        </Btn>
        {checked && !ok && <Callout tone="bad">Either an attacker got through or real customers got HTTP 429s. Check the flagged rows.</Callout>}
        {checked && ok && <Callout tone="ok" icon={CheckCircle2}>Stuffer and scraper receive HTTP 429 after a few seconds, the NAT office shops normally, and the SYN flood never left the RE backbone.</Callout>}
      </div>
    </ConsoleFrame>
  );
}

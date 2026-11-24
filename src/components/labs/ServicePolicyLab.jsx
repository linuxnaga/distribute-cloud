import { CheckCircle2, Play } from 'lucide-react';
import { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { Btn, Callout, ConsoleFrame } from '../ui.jsx';
import RuleList, { TestTable, evaluate } from './RuleList.jsx';

const CORP = '203.0.113.';
const SANCTIONED = ['KP', 'IR', 'SY', 'CU'];

const PALETTE = [
  { id: 'corp-allow', action: 'allow', label: 'ip-prefix-set corp-egress (203.0.113.0/24)', match: (r) => r.ip.startsWith(CORP) },
  { id: 'admin-deny', action: 'deny', label: 'path prefix /admin', match: (r) => r.path.startsWith('/admin') },
  { id: 'tor-deny', action: 'deny', label: 'ip-reputation in [TOR_PROXY, ANONYMIZER]', match: (r) => r.tor },
  { id: 'geo-deny', action: 'deny', label: 'country in [KP, IR, SY, CU]', match: (r) => SANCTIONED.includes(r.country) },
  { id: 'us-only', action: 'deny', label: 'country NOT in [US]', match: (r) => r.country !== 'US' },
  { id: 'post-deny', action: 'deny', label: 'method POST from any', match: (r) => r.method === 'POST' },
];

const TESTS = [
  { label: 'DE shopper · GET /catalog', req: { ip: '91.64.12.8', country: 'DE', path: '/catalog', method: 'GET' }, expect: 'allow' },
  { label: 'US shopper · POST /cart', req: { ip: '73.12.40.2', country: 'US', path: '/cart', method: 'POST' }, expect: 'allow' },
  { label: 'Corp admin 203.0.113.10 · GET /admin', req: { ip: '203.0.113.10', country: 'US', path: '/admin', method: 'GET' }, expect: 'allow' },
  { label: 'Internet 198.51.100.7 · GET /admin', req: { ip: '198.51.100.7', country: 'US', path: '/admin', method: 'GET' }, expect: 'deny' },
  { label: 'TOR exit node · GET /catalog', req: { ip: '185.220.101.4', country: 'NL', path: '/catalog', method: 'GET', tor: true }, expect: 'deny' },
  { label: 'KP client · GET /catalog', req: { ip: '175.45.176.3', country: 'KP', path: '/catalog', method: 'GET' }, expect: 'deny' },
];

export default function ServicePolicyLab() {
  const { state, award, emit } = useGame();
  const [rules, setRules] = useState([]);
  const [results, setResults] = useState(null);

  const run = () => {
    const res = TESTS.map((t) => evaluate(rules, PALETTE, t.req, 'allow'));
    setResults(res);
    if (res.every((r, i) => r.action === TESTS[i].expect)) {
      award('m3.policy');
      emit('policy.pass');
    }
  };
  const pass = results && results.every((r, i) => r.action === TESTS[i].expect);

  return (
    <ConsoleFrame crumbs={['Web App & API Protection', 'Service Policies', 'shop-edge-policy']} activeNav="Service Policies" namespace={state.sim.namespace || 'acme-shop'}>
      <div className="space-y-3">
        <Callout tone="info">
          Service Policies are ordered allow/deny rules evaluated at the Regional Edge before the request is proxied. Build a policy for <span className="font-mono">shop.acme.com</span> that keeps
          /admin to the corporate network, drops anonymizers and sanctioned countries, and never blocks real shoppers.
        </Callout>
        <RuleList palette={PALETTE} rules={rules} setRules={(r) => { setRules(r); setResults(null); }} defaultLabel="default action → ALLOW" />
        <Btn variant="cyan" onClick={run}>
          <Play className="h-4 w-4" /> Replay test requests
        </Btn>
        {results && <TestTable tests={TESTS} results={results} />}
        {results && !pass && <Callout tone="warn">Not there yet. Check the rule order: an allow for the corp prefix has to come before a blanket /admin deny, and country allow-lists punish real customers.</Callout>}
        {pass && (
          <Callout tone="ok" icon={CheckCircle2}>
            Policy verified. Corp admins reach /admin, everyone else is denied there, anonymizers and sanctioned countries are dropped at the RE, and shoppers from any market still check out.
          </Callout>
        )}
      </div>
    </ConsoleFrame>
  );
}

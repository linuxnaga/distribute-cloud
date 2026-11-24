import { CheckCircle2, Play, Route } from 'lucide-react';
import { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { Btn, Callout, ConsoleFrame } from '../ui.jsx';
import RuleList, { TestTable, evaluate } from './RuleList.jsx';

const inNet = (ip, prefix) => ip.startsWith(prefix);
const APP = '10.1.4.';
const DB = '10.1.8.';

const CONNECTORS = [
  { id: 'direct', label: 'Direct, inside ↔ outside (route only)', tone: 'bad', text: 'Routes private addresses straight to the outside network. Internet hosts cannot reply to 10.1.x.x sources, and you have effectively merged the segments. Not what you want for egress.' },
  { id: 'snat', label: 'SNAT to the CE outside interface', tone: 'ok', text: 'Correct. The CE rewrites inside sources to its outside IP, so workloads reach the internet for updates without public IPs, and nothing inbound can start a session.' },
  { id: 'proxy', label: 'Forward proxy (HTTP/HTTPS only)', tone: 'warn', text: 'Works for HTTP(S) package mirrors, but the patch servers also need NTP over UDP 123, which a forward proxy will not carry. Good for URL filtering, not for general egress.' },
];

const PALETTE = [
  { id: 'app-db', action: 'allow', label: 'src 10.1.4.0/24 → dst 10.1.8.0/24 tcp/5432', match: (r) => inNet(r.src, APP) && inNet(r.dst, DB) && r.port === 5432 },
  { id: 'app-web', action: 'allow', label: 'src 10.1.4.0/24 → dst 0.0.0.0/0 tcp/443', match: (r) => inNet(r.src, APP) && r.port === 443 },
  { id: 'vpc-web', action: 'allow', label: 'src 10.1.0.0/16 → dst 0.0.0.0/0 tcp/443', match: (r) => r.src.startsWith('10.1.') && r.port === 443 },
  { id: 'any', action: 'allow', label: 'src any → dst any any', match: () => true },
  { id: 'deny', action: 'deny', label: 'src any → dst any any (explicit deny)', match: () => true },
];

const TESTS = [
  { label: 'app 10.1.4.17 → db 10.1.8.5 :5432', req: { src: '10.1.4.17', dst: '10.1.8.5', port: 5432 }, expect: 'allow' },
  { label: 'app 10.1.4.17 → db 10.1.8.5 :22', req: { src: '10.1.4.17', dst: '10.1.8.5', port: 22 }, expect: 'deny' },
  { label: 'internet 198.51.100.9 → db :5432', req: { src: '198.51.100.9', dst: '10.1.8.5', port: 5432 }, expect: 'deny' },
  { label: 'app 10.1.4.17 → internet :443', req: { src: '10.1.4.17', dst: '151.101.1.69', port: 443 }, expect: 'allow' },
  { label: 'db 10.1.8.5 → internet :443', req: { src: '10.1.8.5', dst: '151.101.1.69', port: 443 }, expect: 'deny' },
];

export default function FirewallLab() {
  const { state, award, emit } = useGame();
  const [conn, setConn] = useState(null);
  const [rules, setRules] = useState(['any']);
  const [results, setResults] = useState(null);
  const c = CONNECTORS.find((x) => x.id === conn);

  const run = () => {
    const res = TESTS.map((t) => evaluate(rules, PALETTE, t.req, 'allow'));
    setResults(res);
    if (res.every((r, i) => r.action === TESTS[i].expect)) {
      award('m2.fw');
      emit('fw.pass');
    }
  };
  const allPass = results && results.every((r, i) => r.action === TESTS[i].expect);

  return (
    <ConsoleFrame crumbs={['Multi-Cloud Network Connect', 'Networking', 'acme-aws-use1', 'Network Connector & Firewall']} activeNav="Networking" namespace="system">
      <div className="space-y-5">
        <section className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <Route className="h-4 w-4 text-emerald" /> Step 1 · Network Connector
          </h3>
          <p className="text-xs text-slate-400">
            Workloads in the AWS VPC have no public IPs but need OS and package updates from the internet (HTTPS plus NTP). Which connector do you attach between the CE inside and outside networks?
          </p>
          {CONNECTORS.map((x) => (
            <button
              key={x.id}
              onClick={() => {
                setConn(x.id);
                if (x.tone === 'ok') award('m2.connector');
              }}
              className={`w-full rounded-lg border p-2.5 text-left text-sm ${conn === x.id ? (x.tone === 'ok' ? 'border-emerald bg-emerald/10' : x.tone === 'warn' ? 'border-amber-400 bg-amber-400/10' : 'border-rose-500 bg-rose-500/10') : 'border-line hover:border-slate-500'} text-white`}
            >
              {x.label}
            </button>
          ))}
          {c && <Callout tone={c.tone}>{c.text}</Callout>}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold text-white">Step 2 · Network Firewall policy</h3>
          <p className="text-xs text-slate-400">
            Build an ordered policy for the CE so the app tier can reach the database on 5432 and the internet on 443, and nothing else gets through. This policy has no built-in default deny, so unmatched traffic is allowed.
          </p>
          <RuleList palette={PALETTE} rules={rules} setRules={(r) => { setRules(r); setResults(null); }} defaultLabel="no match → implicit ALLOW" />
          <Btn variant="cyan" onClick={run}>
            <Play className="h-4 w-4" /> Run test traffic
          </Btn>
          {results && <TestTable tests={TESTS} results={results} />}
          {results && !allPass && <Callout tone="warn">Some flows did not match their expected verdict. Remember: first match wins, so broad rules near the top shadow everything below them.</Callout>}
          {(allPass || state.awarded['m2.fw']) && results && (
            <Callout tone="ok" icon={CheckCircle2}>
              All five flows behave as intended: least-privilege app-to-DB, app-only egress on 443, and an explicit deny at the end.
            </Callout>
          )}
        </section>
      </div>
    </ConsoleFrame>
  );
}

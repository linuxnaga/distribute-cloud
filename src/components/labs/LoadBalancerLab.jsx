import { AlertTriangle, CheckCircle2, Globe, Play, Terminal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { Btn, Callout, ConsoleFrame, Field, StepPill, inputCls } from '../ui.jsx';
import FastTrack from './FastTrack.jsx';

const ORIGIN_TYPES = [
  { value: 'public-ip', label: 'Public IP of Origin Server', private: false },
  { value: 'public-dns', label: 'Public DNS Name of Origin Server', private: false },
  { value: 'site-ip', label: 'IP address of Origin Server on given Sites', private: true },
  { value: 'site-dns', label: 'DNS Name of Origin Server on given Sites', private: true },
  { value: 'k8s', label: 'K8s Service Name of Origin Server on given Sites', private: true },
];
const SITE_OPTS = [
  { value: 'onprem', label: 'acme-dc1-vmware (On-Prem)' },
  { value: 'aws', label: 'acme-aws-use1 (AWS)' },
  { value: 'azure', label: 'acme-azure-weu (Azure)' },
];
const ADVERTISE = [
  { value: 'internet', label: 'Internet (RE Anycast VIP)' },
  { value: 'site', label: 'Site: acme-aws-use1 (private VIP)' },
  { value: 'vsite', label: 'Virtual Site: all-ce-sites' },
];
const dns1123 = /^[a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?$/;

export default function LoadBalancerLab() {
  const { state, updateSim, award, emit } = useGame();
  const sim = state.sim;
  const initialStep = !sim.namespace ? 0 : !sim.pool ? 1 : !sim.lb ? 2 : 3;
  const [step, setStep] = useState(initialStep);

  useEffect(() => {
    if (!sim.namespace) setStep(0);
  }, [sim.namespace]);

  const steps = ['Namespace', 'Origin Pool', 'HTTP LB', 'Test Traffic'];
  const stepState = (i) => ([sim.namespace, sim.pool, sim.lb, state.awarded['m2.test'] && sim.lb][i] ? 'done' : i === step ? 'active' : 'todo');

  return (
    <ConsoleFrame
      crumbs={['Multi-Cloud App Connect', ['Namespaces', 'Origin Pools', 'Load Balancers', 'Load Balancers'][step], ['Add Namespace', 'Add Origin Pool', 'Add HTTP LB', 'Test'][step]]}
      activeNav={step === 1 ? 'Origin Pools' : 'Load Balancers'}
      namespace={sim.namespace}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {steps.map((l, i) => (
          <StepPill key={l} n={i + 1} label={l} state={stepState(i)} onClick={() => setStep(i)} />
        ))}
      </div>
      {step === 0 && <NamespaceStep onDone={() => setStep(1)} />}
      {step === 1 && <PoolStep onDone={() => setStep(2)} />}
      {step === 2 && <LbStep onDone={() => setStep(3)} />}
      {step === 3 && <TestStep onEdit={() => setStep(2)} />}
    </ConsoleFrame>
  );
}

function NamespaceStep({ onDone }) {
  const { state, updateSim, award, emit } = useGame();
  const sim = state.sim;
  const [name, setName] = useState(sim.namespace || 'acme-shop');
  const valid = dns1123.test(name);
  return (
    <div className="space-y-3">
      <Callout tone="info">Namespaces isolate configuration objects and RBAC per team or app. Sites live in <span className="font-mono">system</span>; your LB and pool will live here.</Callout>
      <Field label="Namespace name" hint="Lowercase letters, digits and hyphens (DNS-1123).">
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!valid} />
      </Field>
      {!valid && <p className="text-xs text-rose-400">Invalid name. Use lowercase letters, digits and "-".</p>}
      <Btn
        disabled={!valid}
        onClick={() => {
          updateSim({ namespace: name });
          award('m2.ns');
          emit('ns.created');
          onDone();
        }}
      >
        Save namespace
      </Btn>
    </div>
  );
}

function PoolStep({ onDone }) {
  const { state, updateSim, award, emit } = useGame();
  const sim = state.sim;
  const [form, setForm] = useState({ name: 'catalog-pool', type: 'site-ip', ip: '10.1.4.17', site: 'onprem', network: 'inside', port: '8080' });
  const [err, setErr] = useState(null);
  const type = ORIGIN_TYPES.find((t) => t.value === form.type);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  if (!sim.namespace) return <Callout tone="warn">Create a namespace first.</Callout>;
  const save = () => {
    if (!dns1123.test(form.name)) return setErr('Pool name must be DNS-1123.');
    if (type.private && sim.sites[form.site] !== 'online') return setErr(`Site ${form.site} is not online. Origins on given Sites are reached through that CE.`);
    if (type.private && form.network !== 'inside') return setErr('The backend lives on the CE inside network. Selecting the outside network would send traffic toward the internet-facing interface.');
    if (type.private && !/^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(form.ip) && form.type === 'site-ip') return setErr('Expected a private (RFC1918) address for an origin on a site.');
    setErr(null);
    const pool = { ...form, private: type.private };
    updateSim({ pool });
    award(type.private ? 'm2.pool' : null);
    if (type.private) emit('pool.private');
    onDone();
  };
  return (
    <div className="space-y-3">
      <FastTrack need={['onprem']} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <input className={inputCls} value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Port">
          <input className={inputCls} value={form.port} onChange={set('port')} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Origin server type">
            <select className={inputCls} value={form.type} onChange={set('type')}>
              {ORIGIN_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={type.private ? 'Origin IP / name (private)' : 'Public IP / FQDN'}>
          <input className={inputCls} value={type.private ? form.ip : '52.14.88.201'} onChange={set('ip')} disabled={!type.private} />
        </Field>
        {type.private && (
          <>
            <Field label="Site">
              <select className={inputCls} value={form.site} onChange={set('site')}>
                {SITE_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label} {sim.sites[o.value] !== 'online' ? '· offline' : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Select network on the site">
              <select className={inputCls} value={form.network} onChange={set('network')}>
                <option value="inside">Inside Network</option>
                <option value="outside">Outside Network</option>
              </select>
            </Field>
          </>
        )}
      </div>
      {!type.private && (
        <Callout tone="warn" icon={AlertTriangle}>
          A public origin must be reachable from the internet. That breaks the zero-trust requirement that the backend keeps no public IP. Allowed here, but it will not complete the private-pool task.
        </Callout>
      )}
      {err && <Callout tone="bad">{err}</Callout>}
      <Btn onClick={save}>Save origin pool</Btn>
    </div>
  );
}

function LbStep({ onDone }) {
  const { state, updateSim, award, emit } = useGame();
  const sim = state.sim;
  const [form, setForm] = useState({ name: 'shop-lb', domain: 'shop.acme.com', adv: 'internet', tls: 'auto' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  if (!sim.pool) return <Callout tone="warn">Create an origin pool first.</Callout>;
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <input className={inputCls} value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Domain">
          <input className={inputCls} value={form.domain} onChange={set('domain')} />
        </Field>
        <Field label="Load balancer type">
          <select className={inputCls} value={form.tls} onChange={set('tls')}>
            <option value="auto">HTTPS with Automatic Certificate</option>
            <option value="http">HTTP</option>
          </select>
        </Field>
        <Field label="Origin pool">
          <input className={inputCls} value={`${sim.pool.name} (${sim.pool.private ? `site ${sim.pool.site}` : 'public'})`} disabled />
        </Field>
        <div className="sm:col-span-2">
          <Field label="VIP advertisement" hint="Internet places the VIP on every RE via Anycast. Site / Virtual Site creates a private VIP on CEs.">
            <select className={inputCls} value={form.adv} onChange={set('adv')}>
              {ADVERTISE.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>
      <Btn
        onClick={() => {
          if (!form.domain.includes('.')) return;
          updateSim({ lb: { ...form, vip: form.adv === 'internet' ? '159.60.141.18 (Anycast)' : '10.1.255.10 (site-local inside)' } });
          if (form.adv === 'internet') {
            award('m2.lb');
            emit('lb.internet');
          }
          onDone();
        }}
      >
        Save and exit
      </Btn>
    </div>
  );
}

function TestStep({ onEdit }) {
  const { state, updateSim, award, emit } = useGame();
  const sim = state.sim;
  const [lines, setLines] = useState([]);
  const [running, setRunning] = useState(false);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  if (!sim.lb) return <Callout tone="warn">Create the HTTP load balancer first.</Callout>;
  const lb = sim.lb;
  const pool = sim.pool;
  const originUp = !pool.private || sim.sites[pool.site] === 'online';
  const run = () => {
    setRunning(true);
    setLines([]);
    const ok = lb.adv === 'internet' && originUp;
    const seq = [
      `$ curl -sv https://${lb.domain}/catalog`,
      lb.adv === 'internet' ? `* Resolved ${lb.domain} → 159.60.141.18 (Anycast, nearest PoP: ashburn-re-1)` : `* Resolved ${lb.domain} → 10.1.255.10 (private VIP)`,
      ...(lb.adv === 'internet'
        ? [
            `* TLS 1.3 handshake terminated at RE ashburn-re-1 (auto cert, ${lb.domain})`,
            '> GET /catalog HTTP/2',
            `* RE → backbone → ${pool.private ? `${pool.site === 'aws' ? 'ashburn' : 'frankfurt'}-re → IPsec tunnel → CE ${pool.site}` : 'public internet → origin'}`,
            ...(originUp
              ? [
                  pool.private ? `* CE forwards on inside network → ${pool.ip}:${pool.port}` : '* Origin reached over public IP 52.14.88.201',
                  '< HTTP/2 200',
                  '< server: volt-adc',
                  '< x-envoy-upstream-service-time: 23',
                  '{"items":128,"region":"global"}',
                ]
              : ['< HTTP/2 503  (no healthy origin: site offline)'])
          ]
        : ['* Connection timed out after 5001 ms', '! A site-local VIP is only reachable from inside the AWS VPC, not from the internet. Re-advertise on Internet.']),
    ];
    seq.forEach((l, i) =>
      timers.current.push(
        setTimeout(() => {
          setLines((x) => [...x, l]);
          if (i === seq.length - 1) {
            setRunning(false);
            if (ok) {
              award('m2.test');
              emit('traffic.ok');
            }
          }
        }, 380 * (i + 1)),
      ),
    );
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded border border-line bg-ink p-2">
          <div className="text-slate-500">VIP</div>
          <div className="font-mono text-white">{lb.vip}</div>
        </div>
        <div className="rounded border border-line bg-ink p-2">
          <div className="text-slate-500">Origin</div>
          <div className="font-mono text-white">
            {pool.private ? `${pool.ip}:${pool.port} via ${pool.site}` : '52.14.88.201 (public!)'}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Btn variant="cyan" onClick={run} disabled={running}>
          <Play className="h-4 w-4" /> Send test request
        </Btn>
        <Btn variant="ghost" onClick={onEdit}>
          Edit LB
        </Btn>
      </div>
      <div className="min-h-[180px] rounded-lg border border-line bg-black/60 p-3 font-mono text-[11.5px] leading-relaxed" aria-live="polite">
        <div className="mb-1 flex items-center gap-1.5 text-slate-500">
          <Terminal className="h-3.5 w-3.5" /> user@laptop (internet)
        </div>
        {lines.map((l, i) => (
          <div key={i} className={l.startsWith('< HTTP/2 200') ? 'text-emerald' : l.includes('503') || l.startsWith('!') || l.includes('timed out') ? 'text-rose-400' : l.startsWith('$') ? 'text-white' : 'text-slate-400'}>
            {l}
          </div>
        ))}
        {running && <span className="caret text-cyan">▋</span>}
      </div>
      {state.awarded['m2.test'] && lines.some((l) => l.includes('200')) && (
        <Callout tone="ok" icon={CheckCircle2}>
          End to end: user → Anycast RE → private backbone → encrypted tunnel → CE → private origin. <Globe className="inline h-3.5 w-3.5" /> The origin has no public IP.
        </Callout>
      )}
    </div>
  );
}


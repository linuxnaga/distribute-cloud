import { Bell, CheckCircle2, Container, Flag, Loader2, RotateCcw, Rocket, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { SERVICES, serviceMetrics } from '../../sim/metrics.js';
import { Btn, Callout, ConsoleFrame, Field, StepPill, inputCls } from '../ui.jsx';
import FastTrack from './FastTrack.jsx';

const TARGETS = [
  { id: 'aws', name: 'acme-aws-use1', labels: 'site-type=ce, cloud=aws', needs: 'aws' },
  { id: 'azure', name: 'acme-azure-weu', labels: 'site-type=ce, cloud=azure', needs: 'azure' },
  { id: 'onprem', name: 'acme-dc1-vmware', labels: 'site-type=ce, cloud=onprem', needs: 'onprem' },
  { id: 're-sin', name: 'singapore-re-1', labels: 'site-type=re, region=apac', needs: null },
];
const SIEMS = ['Splunk HEC', 'Datadog', 'Microsoft Sentinel', 'AWS S3 (data lake)'];
const RULES = [
  { id: 'lat', label: 'p95 latency > 500 ms for 1 min' },
  { id: 'err', label: 'Error rate > 2% for 1 min' },
  { id: 'waf', label: 'WAF security events > 100 / min' },
];

function Spark({ data: raw, color }) {
  const data = raw.length < 2 ? [raw[0] || 0, raw[0] || 0] : raw;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 80},${22 - (v / max) * 20}`).join(' ');
  return (
    <svg viewBox="0 0 80 24" className="h-6 w-20" aria-hidden>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export default function AppStackLab() {
  const { state, updateSim, award, emit } = useGame();
  const sim = state.sim;
  const as = sim.appstack;
  const [tab, setTab] = useState(as.deployed ? 1 : 0);
  const setAs = (patch) => updateSim((x) => ({ ...x, appstack: { ...x.appstack, ...patch } }));

  return (
    <ConsoleFrame
      crumbs={['Distributed Apps', tab === 0 ? 'Virtual K8s' : tab === 1 ? 'Service Graph' : 'Alerts & Log Receivers', ['Deploy Workload', 'RELT Dashboard', 'SIEM Integration'][tab]]}
      activeNav={['Virtual K8s', 'Service Graph', 'Log Receivers'][tab]}
      namespace={sim.namespace || 'acme-shop'}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {['Deploy vK8s', 'RELT & Service Graph', 'SIEM & Alerts'].map((l, i) => (
          <StepPill key={l} n={i + 1} label={l} state={[as.deployed, as.diagnosed, !!as.siem?.fired][i] ? 'done' : tab === i ? 'active' : 'todo'} onClick={() => setTab(i)} />
        ))}
      </div>
      {tab === 0 && <DeployTab as={as} setAs={setAs} sim={sim} award={award} emit={emit} onNext={() => setTab(1)} />}
      {tab === 1 && <ReltTab as={as} setAs={setAs} award={award} emit={emit} onNext={() => setTab(2)} />}
      {tab === 2 && <SiemTab as={as} setAs={setAs} sim={sim} award={award} emit={emit} />}
    </ConsoleFrame>
  );
}

function DeployTab({ as, setAs, sim, award, emit, onNext }) {
  const [sel, setSel] = useState(as.sites.length ? as.sites : ['azure', 're-sin']);
  const [replicas, setReplicas] = useState(as.replicas);
  const [phase, setPhase] = useState(as.deployed ? 'done' : 'idle');
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const available = (t) => !t.needs || sim.sites[t.needs] === 'online';

  const deploy = () => {
    setPhase('creating');
    setAs({ deployed: false, sites: sel, replicas, fault: null, diagnosed: false });
    timers.current.push(setTimeout(() => setPhase('pulling'), 700));
    timers.current.push(
      setTimeout(() => {
        setPhase('done');
        setAs({ deployed: true });
        award('m4.deploy');
        emit('vk8s.deployed');
        if (sel.length >= 3) {
          award('m4.multisite');
          emit('vk8s.multisite');
        }
      }, 1700),
    );
  };

  return (
    <div className="space-y-3">
      <FastTrack need={['aws', 'onprem'].filter((s) => sel.includes(s))} />
      <Field label="Virtual Site · select targets by label" hint="Every site the selector matches receives the Deployment. REs can run vK8s workloads too.">
        <div className="grid gap-1.5 sm:grid-cols-2">
          {TARGETS.map((t) => (
            <label key={t.id} className={`flex cursor-pointer items-start gap-2 rounded-md border p-2 text-xs ${sel.includes(t.id) ? 'border-purple-400/60 bg-purple-500/10' : 'border-line'} ${available(t) ? '' : 'opacity-60'}`}>
              <input
                type="checkbox"
                className="mt-0.5 accent-purple-500"
                checked={sel.includes(t.id)}
                onChange={(e) => setSel((s) => (e.target.checked ? [...s, t.id] : s.filter((x) => x !== t.id)))}
              />
              <span>
                <span className="block font-mono font-semibold text-white">{t.name}</span>
                <span className="block font-mono text-[10px] text-slate-500">{t.labels}{available(t) ? '' : ' · site offline'}</span>
              </span>
            </label>
          ))}
        </div>
      </Field>
      <Field label={`Replicas per site: ${replicas}`}>
        <input type="range" min={1} max={4} value={replicas} onChange={(e) => setReplicas(+e.target.value)} className="w-full accent-purple-500" />
      </Field>
      <pre className="overflow-x-auto rounded-lg border border-line bg-black/60 p-2.5 font-mono text-[10.5px] leading-relaxed text-slate-300">
{`apiVersion: apps/v1
kind: Deployment
metadata:
  name: inventory-cache
  annotations:
    ves.io/virtual-sites: acme-shop/edge-vsite   # ${sel.length} site(s)
spec:
  replicas: ${replicas}
  template:
    spec:
      containers:
      - name: cache
        image: registry.acme.com/inventory-cache:2.4`}
      </pre>
      <div className="flex items-center gap-2">
        <Btn onClick={deploy} disabled={!sel.length || sel.some((s) => !available(TARGETS.find((t) => t.id === s))) || phase === 'creating' || phase === 'pulling'}>
          <Rocket className="h-4 w-4" /> kubectl apply
        </Btn>
        {phase === 'done' && (
          <Btn variant="ghost" onClick={onNext}>
            Open RELT dashboard →
          </Btn>
        )}
      </div>
      {phase !== 'idle' && (
        <div className="grid gap-1.5 sm:grid-cols-2">
          {sel.map((s) => (
            <div key={s} className="flex items-center gap-2 rounded border border-line bg-panel/60 px-2 py-1.5 font-mono text-[11px]">
              {phase === 'done' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald" /> : <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />}
              <span className="text-white">{TARGETS.find((t) => t.id === s).name}</span>
              <span className="ml-auto text-slate-400">
                {phase === 'done' ? `${replicas}/${replicas} Running` : phase === 'pulling' ? 'ContainerCreating' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      )}
      {phase === 'done' && sel.length < 3 && <Callout tone="info">Tip: select 3 or more sites to push the cache to every edge (bonus task).</Callout>}
    </div>
  );
}

function ReltTab({ as, setAs, award, emit, onNext }) {
  const [tick, setTick] = useState(0);
  const [history, setHistory] = useState({});
  const [wrong, setWrong] = useState(null);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const rows = SERVICES.filter((s) => as.sites.includes(s.id));
  useEffect(() => {
    setHistory((h) => {
      const n = { ...h };
      for (const r of rows) n[r.id] = [...(h[r.id] || []), serviceMetrics(r.site, as.fault, tick).lat].slice(-16);
      return n;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  if (!as.deployed) return <Callout tone="warn">Deploy the vK8s workload first.</Callout>;

  const inject = () => {
    const victim = as.sites[Math.floor(Math.random() * as.sites.length)];
    setWrong(null);
    setAs({ fault: victim, diagnosed: false });
  };
  const flag = (id) => {
    if (!as.fault) return;
    if (id === as.fault) {
      setAs({ diagnosed: true });
      award('m4.diagnose');
      emit('relt.diagnosed');
    } else setWrong(id);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Btn variant="danger" onClick={inject} disabled={!!as.fault && !as.diagnosed}>
          <Zap className="h-4 w-4" /> Inject fault (bad rollout)
        </Btn>
        {as.fault && as.diagnosed && (
          <Btn variant="ghost" onClick={() => setAs({ fault: null })}>
            <RotateCcw className="h-4 w-4" /> Roll back the bad version
          </Btn>
        )}
        {as.diagnosed && (
          <Btn variant="ghost" onClick={onNext}>
            Wire alerts to SIEM →
          </Btn>
        )}
      </div>
      {as.fault && !as.diagnosed && <Callout tone="warn">Users report slow inventory lookups. Watch the RELT signals (and the canvas RELT layer), then flag the culprit edge.</Callout>}
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full text-xs">
          <thead className="bg-panel2 text-slate-400">
            <tr>
              <th className="px-2 py-1.5 text-left">Service edge</th>
              <th className="px-2 py-1.5 text-right" title="Requests per second">R rps</th>
              <th className="px-2 py-1.5 text-right" title="Error rate">E %</th>
              <th className="px-2 py-1.5 text-right" title="p95 latency">L p95</th>
              <th className="px-2 py-1.5 text-right" title="Throughput">T Mbps</th>
              <th className="px-2 py-1.5">Latency trend</th>
              <th className="px-2 py-1.5" />
            </tr>
          </thead>
          <tbody className="font-mono">
            {rows.map((r) => {
              const m = serviceMetrics(r.site, as.fault, tick);
              const bad = m.lat > 250;
              return (
                <tr key={r.id} className={`border-t border-line ${bad ? 'bg-rose-500/10' : ''}`}>
                  <td className="px-2 py-1.5 font-sans text-white">
                    <Container className="mr-1 inline h-3.5 w-3.5 text-purple-400" />
                    {r.name}
                  </td>
                  <td className="px-2 py-1.5 text-right text-slate-300">{m.rps}</td>
                  <td className={`px-2 py-1.5 text-right ${m.err > 2 ? 'text-rose-400' : 'text-slate-300'}`}>{m.err}</td>
                  <td className={`px-2 py-1.5 text-right ${bad ? 'font-bold text-rose-400' : 'text-slate-300'}`}>{m.lat}ms</td>
                  <td className="px-2 py-1.5 text-right text-slate-300">{m.thr}</td>
                  <td className="px-2 py-1.5">
                    <Spark data={history[r.id] || [0, 0]} color={bad ? '#f43f5e' : '#a855f7'} />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <button
                      onClick={() => flag(r.id)}
                      disabled={!as.fault || as.diagnosed}
                      className={`rounded border px-1.5 py-0.5 font-sans text-[10px] font-semibold disabled:opacity-30 ${wrong === r.id ? 'border-rose-500 text-rose-300' : 'border-line text-slate-300 hover:border-cyan hover:text-cyan'}`}
                    >
                      <Flag className="mr-0.5 inline h-3 w-3" /> Culprit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {wrong && <Callout tone="bad">That edge looks healthy. Compare latency and error columns across sites.</Callout>}
      {as.diagnosed && (
        <Callout tone="ok" icon={CheckCircle2}>
          Correct: the {SERVICES.find((s) => s.id === as.fault)?.name || 'faulty edge'} replica regressed after the rollout (p95 ~600 ms, errors ~4%). The other edges stayed healthy, which points to a site-local problem, not the app version everywhere.
        </Callout>
      )}
    </div>
  );
}

function SiemTab({ as, setAs, sim, award, emit }) {
  const [siem, setSiem] = useState(as.siem?.target || SIEMS[0]);
  const [rule, setRule] = useState(as.siem?.rule || 'lat');
  const [result, setResult] = useState(as.siem?.fired ? 'fired' : null);
  const incident = as.fault || as.diagnosed;
  const conditionMet = rule === 'waf' ? (sim.lastBurst?.attacks || []).reduce((s, a) => s + a.blocked, 0) > 100 : incident;

  const evaluate = () => {
    if (!conditionMet) {
      setResult('quiet');
      return;
    }
    setResult('fired');
    setAs({ siem: { target: siem, rule, fired: true } });
    award('m4.siem');
    emit('siem.alert');
  };

  const payload = {
    alertname: rule === 'waf' ? 'WafEventSpike' : rule === 'err' ? 'HighErrorRate' : 'HighP95Latency',
    severity: 'major',
    namespace: sim.namespace || 'acme-shop',
    vh_name: 'ves-io-http-loadbalancer-shop-lb',
    site: rule === 'waf' ? 'ashburn-re-1' : SERVICES.find((s) => s.id === as.fault)?.name || 'inventory-cache',
    value: rule === 'lat' ? '612ms' : rule === 'err' ? '4.3%' : '1,180/min',
    receiver: siem,
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Global Log Receiver" hint="Streams request, security & audit logs.">
          <select className={inputCls} value={siem} onChange={(e) => setSiem(e.target.value)}>
            {SIEMS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Alert policy rule">
          <select className={inputCls} value={rule} onChange={(e) => setRule(e.target.value)}>
            {RULES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Btn onClick={evaluate}>
        <Bell className="h-4 w-4" /> Save & evaluate alert policy
      </Btn>
      {result === 'quiet' && (
        <Callout tone="info">
          Policy saved, but the condition is not met right now, so nothing fired. {rule === 'waf' ? 'Run an attack burst in Module 3 to generate WAF events.' : 'Inject a fault on the RELT tab to create an incident.'}
        </Callout>
      )}
      {result === 'fired' && (
        <div className="space-y-2">
          <Callout tone="ok" icon={Bell}>
            Alert fired and delivered to <b>{siem}</b>. The SOC now sees the same signal as the platform team.
          </Callout>
          <pre className="overflow-x-auto rounded-lg border border-emerald/40 bg-black/60 p-2.5 font-mono text-[10.5px] text-emerald">{JSON.stringify(payload, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}


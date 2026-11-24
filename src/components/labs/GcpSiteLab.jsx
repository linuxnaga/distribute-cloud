import { CheckCircle2, Cloud, Loader2, Lock, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { Btn, Callout, ConsoleFrame, Field, inputCls } from '../ui.jsx';

const REGIONS = [
  { id: 'us-east4', label: 'us-east4 (N. Virginia)', res: ['ashburn-re-1', 'newyork-re-2'] },
  { id: 'europe-west3', label: 'europe-west3 (Frankfurt)', res: ['frankfurt-re-2', 'amsterdam-re-1'] },
  { id: 'asia-southeast1', label: 'asia-southeast1 (Singapore)', res: ['singapore-re-1', 'tokyo-re-1'] },
];
const TYPES = [
  { id: 'ingress', label: 'Ingress Gateway (One Interface)' },
  { id: 'ingress-egress', label: 'Ingress/Egress Gateway (Two Interface)' },
  { id: 'appstack', label: 'App Stack Cluster (One Interface)' },
];
const STAGES = ['terraform plan: 17 to add, 0 to change', 'Creating inside & outside subnets', 'Launching CE instances', 'Site auto-registered via cloud credentials', 'Upgrading CE software', 'IPsec tunnel to RE #1 up', 'IPsec tunnel to RE #2 up', 'Site ONLINE'];

export default function GcpSiteLab() {
  const { award, emit } = useGame();
  const [f, setF] = useState({ creds: '', region: 'asia-southeast1', type: 'ingress', nodes: 1, zones: ['a'] });
  const [errors, setErrors] = useState(null);
  const [stage, setStage] = useState(-1);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const region = REGIONS.find((r) => r.id === f.region);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const apply = () => {
    const e = [];
    if (!f.creds) e.push('Select cloud credentials. Cloud sites are deployed and auto-registered through a service account, no manual token.');
    if (f.region !== 'asia-southeast1') e.push('The checkout VPC lives in asia-southeast1. The CE must sit in the same region as the workloads it fronts.');
    if (f.type !== 'ingress-egress') e.push('Workloads must also egress through the CE, so you need two interfaces (inside + outside): Ingress/Egress Gateway.');
    if (f.nodes !== 3) e.push('Production must survive a node failure: deploy 3 nodes (control-plane quorum).');
    if (f.nodes === 3 && f.zones.length < 3) e.push('Spread the 3 nodes across 3 availability zones so a zone outage cannot take the site down.');
    setErrors(e);
    if (e.length) return;
    setStage(0);
    STAGES.forEach((_, i) =>
      timers.current.push(
        setTimeout(() => {
          setStage(i);
          if (i === STAGES.length - 1) {
            award('m1.gcp');
            emit('site.online:gcp');
          }
        }, 550 * (i + 1)),
      ),
    );
  };

  const busy = stage >= 0 && stage < STAGES.length - 1;

  return (
    <ConsoleFrame crumbs={['Multi-Cloud Network Connect', 'Site Management', 'GCP VPC Sites', 'Add GCP VPC Site']} activeNav="Site Management" namespace="system">
      <div className="space-y-3">
        <Callout tone="info" icon={Cloud}>
          <b>Requirement:</b> stand up a production CE for the new <span className="font-mono">checkout</span> VPC in GCP <span className="font-mono">asia-southeast1</span>. It must survive a zone outage and carry both inbound app traffic and outbound egress for the VPC.
        </Callout>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <input className={inputCls} value="acme-gcp-sin-checkout" disabled />
          </Field>
          <Field label="Cloud credentials">
            <select className={inputCls} value={f.creds} onChange={(e) => set('creds', e.target.value)}>
              <option value="">Select…</option>
              <option value="gcp-acme-sa">gcp-acme-sa (service account)</option>
            </select>
          </Field>
          <Field label="GCP region">
            <select className={inputCls} value={f.region} onChange={(e) => set('region', e.target.value)}>
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Site type">
            <select className={inputCls} value={f.type} onChange={(e) => set('type', e.target.value)}>
              {TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field group label="Nodes">
            <div className="flex gap-1.5">
              {[1, 3].map((n) => (
                <button key={n} onClick={() => set('nodes', n)} className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${f.nodes === n ? 'border-cyan bg-cyan/15 text-cyan' : 'border-line text-slate-400'}`}>
                  {n} node{n > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </Field>
          <Field group label="Availability zones">
            <div className="flex gap-1.5">
              {['a', 'b', 'c'].map((z) => (
                <label key={z} className={`flex items-center gap-1 rounded-md border px-2 py-1.5 font-mono text-xs ${f.zones.includes(z) ? 'border-cyan text-cyan' : 'border-line text-slate-400'}`}>
                  <input type="checkbox" className="accent-cyan-500" checked={f.zones.includes(z)} onChange={(e) => set('zones', e.target.checked ? [...f.zones, z] : f.zones.filter((x) => x !== z))} />
                  {f.region}-{z}
                </label>
              ))}
            </div>
          </Field>
        </div>
        <Btn onClick={apply} disabled={busy}>
          Apply (deploy site)
        </Btn>
        {errors?.length > 0 && (
          <div className="space-y-1.5">
            {errors.map((e) => (
              <Callout key={e} tone="bad" icon={XCircle}>
                {e}
              </Callout>
            ))}
          </div>
        )}
        {stage >= 0 && (
          <div className="rounded-lg border border-line bg-black/60 p-3 font-mono text-[11px] leading-relaxed">
            {STAGES.slice(0, stage + 1).map((s, i) => (
              <div key={s} className={i === STAGES.length - 1 ? 'font-bold text-emerald' : i === stage ? 'text-amber-300' : 'text-slate-400'}>
                {i === stage && i < STAGES.length - 1 ? <Loader2 className="mr-1 inline h-3 w-3 animate-spin" /> : '✓ '}
                {s.replace('RE #1', region.res[0]).replace('RE #2', region.res[1])}
              </div>
            ))}
          </div>
        )}
        {stage === STAGES.length - 1 && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {region.res.map((r) => (
                <div key={r} className="flex items-center gap-1.5 rounded border border-emerald/50 bg-emerald/10 px-2 py-1 font-mono text-[11px] text-emerald">
                  <Lock className="h-3 w-3" /> IPsec → {r} <span className="ml-auto">UP</span>
                </div>
              ))}
            </div>
            <Callout tone="ok" icon={CheckCircle2}>
              3-node Ingress/Egress CE across 3 zones is online. Unlike the manual VMware site, a cloud site needs no token approval: XC deploys it with your credentials and registers it for you.
            </Callout>
          </>
        )}
      </div>
    </ConsoleFrame>
  );
}

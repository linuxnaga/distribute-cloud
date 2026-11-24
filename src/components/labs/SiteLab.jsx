import { CheckCircle2, CircleDashed, KeyRound, Loader2, Lock, ShieldAlert, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { TUNNELS } from '../FlowCanvas.jsx';
import { Btn, Callout, ConsoleFrame } from '../ui.jsx';

const RE_NAME = { 're-ash': 'ashburn-re-1', 're-fra': 'frankfurt-re-2', 're-sin': 'singapore-re-1' };

export const SITES = {
  aws: { name: 'acme-aws-use1', env: 'AWS VPC · us-east-1', nodes: 3, hw: 'aws-byol-multi-nic-voltmesh', token: 'b7c2-41fd-9a3e-0c11', coords: '38.94, -77.45' },
  onprem: { name: 'acme-dc1-vmware', env: 'On-Prem DC · VMware ESXi', nodes: 1, hw: 'vmware-voltmesh', token: 'e19a-77c0-2d58-f4b6', coords: '50.11, 8.68' },
  azure: { name: 'acme-azure-weu', env: 'Azure VNet · westeurope', nodes: 3, hw: 'azure-byol-voltstack-combo', token: '—', coords: '52.37, 4.90' },
};

const STEPS = ['Validating registration token', 'Admitting nodes to cluster', 'Downloading & upgrading software', 'Establishing tunnel to RE #1', 'Establishing tunnel to RE #2', 'Site ONLINE'];

export function provisionSite(site, { updateSim, award, emit, getSim }) {
  updateSim((s) => ({ ...s, sites: { ...s.sites, [site]: 'provisioning' }, provision: { ...s.provision, [site]: 0 } }));
  STEPS.forEach((_, i) => {
    setTimeout(() => {
      const last = i === STEPS.length - 1;
      updateSim((s) => ({
        ...s,
        provision: { ...s.provision, [site]: i },
        sites: last ? { ...s.sites, [site]: 'online' } : s.sites,
      }));
      if (last) {
        emit(`site.online:${site}`);
        if (award) award(`m1.site.${site}`);
        const sim = getSim();
        const other = site === 'aws' ? 'onprem' : 'aws';
        if (sim.sites[other] === 'online') {
          award?.('m1.tunnels');
          emit('tunnels.all');
        }
      }
    }, 650 * (i + 1));
  });
}

export default function SiteLab() {
  const { state, updateSim, award, emit, getSim } = useGame();
  const sim = state.sim;
  const [reviewing, setReviewing] = useState(null);

  const accept = (site) => {
    setReviewing(null);
    provisionSite(site, { updateSim, award, emit, getSim });
  };

  const tunnelType = (site) => (site === 'onprem' && sim.sslFallback ? 'SSL' : 'IPsec');
  const pending = ['aws', 'onprem'].filter((s) => sim.sites[s] === 'pending');

  return (
    <ConsoleFrame crumbs={['Multi-Cloud Network Connect', 'Site Management', 'Registrations']} activeNav="Site Management" namespace="system">
      <div className="space-y-4">
        <Callout tone="info" icon={KeyRound}>
          Each CE booted with a <b>site token</b> from your tenant and now waits for approval. Accept a registration to admit the nodes and watch the CE build redundant tunnels to its two nearest Regional Edges.
        </Callout>

        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Pending registrations ({pending.length})</h3>
          {pending.length === 0 && <div className="rounded-lg border border-dashed border-line p-3 text-xs text-slate-500">No pending registrations. All sites admitted.</div>}
          <div className="space-y-2">
            {pending.map((site) => {
              const s = SITES[site];
              return (
                <div key={site} className="rounded-lg border border-amber-400/40 bg-amber-400/5 p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <CircleDashed className="h-5 w-5 text-amber-400" />
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-sm font-semibold text-white">{s.name}</div>
                      <div className="text-xs text-slate-400">
                        {s.env} · {s.nodes} node{s.nodes > 1 ? 's' : ''} · token {s.token}
                      </div>
                    </div>
                    <Btn variant="cyan" onClick={() => setReviewing(site)}>
                      Review & Accept
                    </Btn>
                  </div>
                  {reviewing === site && (
                    <div className="mt-3 grid gap-2 rounded-md border border-line bg-ink p-3 text-xs sm:grid-cols-2">
                      <div><span className="text-slate-500">Site name</span><div className="font-mono text-white">{s.name}</div></div>
                      <div><span className="text-slate-500">Certified hardware</span><div className="font-mono text-white">{s.hw}</div></div>
                      <div><span className="text-slate-500">Coordinates</span><div className="font-mono text-white">{s.coords}</div></div>
                      <div><span className="text-slate-500">Nearest REs</span><div className="font-mono text-white">{TUNNELS[site].map((r) => RE_NAME[r]).join(', ')}</div></div>
                      {site === 'onprem' && (
                        <label className="flex items-center gap-2 sm:col-span-2">
                          <input type="checkbox" checked={sim.sslFallback} onChange={(e) => updateSim({ sslFallback: e.target.checked })} className="accent-amber-400" />
                          <span className="text-slate-300">Corporate firewall blocks UDP 4500 (IPsec NAT-T)</span>
                        </label>
                      )}
                      <div className="flex gap-2 sm:col-span-2">
                        <Btn onClick={() => accept(site)}>Accept registration</Btn>
                        <Btn variant="ghost" onClick={() => setReviewing(null)}>Cancel</Btn>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Sites & tunnels</h3>
          <div className="space-y-2">
            {['aws', 'onprem', 'azure'].map((site) => {
              const st = sim.sites[site];
              const s = SITES[site];
              const step = sim.provision?.[site] ?? -1;
              return (
                <div key={site} className="rounded-lg border border-line bg-panel/60 p-3">
                  <div className="flex items-center gap-2">
                    {st === 'online' ? <CheckCircle2 className="h-4 w-4 text-emerald" /> : st === 'provisioning' ? <Loader2 className="h-4 w-4 animate-spin text-amber-400" /> : <CircleDashed className="h-4 w-4 text-slate-500" />}
                    <span className="font-mono text-sm text-white">{s.name}</span>
                    <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${st === 'online' ? 'bg-emerald/15 text-emerald' : st === 'provisioning' ? 'bg-amber-400/15 text-amber-300' : 'bg-slate-700/40 text-slate-400'}`}>
                      {st === 'pending' ? 'Waiting for approval' : st}
                    </span>
                    {st === 'online' && site !== 'azure' && (
                      <button title="Decommission site (for practice)" onClick={() => updateSim((x) => ({ ...x, sites: { ...x.sites, [site]: 'pending' }, provision: { ...x.provision, [site]: -1 } }))} className="text-slate-500 hover:text-rose-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {st === 'provisioning' && (
                    <ol className="mt-2 space-y-0.5 pl-6 font-mono text-[11px]">
                      {STEPS.map((label, i) => (
                        <li key={label} className={i < step ? 'text-emerald' : i === step ? 'text-amber-300' : 'text-slate-600'}>
                          {i < step ? '✓' : i === step ? '›' : '·'} {label.replace('RE #1', RE_NAME[TUNNELS[site][0]]).replace('RE #2', RE_NAME[TUNNELS[site][1]])}
                        </li>
                      ))}
                    </ol>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {TUNNELS[site].map((re, i) => {
                      const up = st === 'online' || (st === 'provisioning' && step > 3 + i);
                      return (
                        <div key={re} className={`flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-[11px] ${up ? 'border-emerald/50 bg-emerald/10 text-emerald' : 'border-line text-slate-500'}`}>
                          <Lock className="h-3 w-3" />
                          {tunnelType(site)} → {RE_NAME[re]}
                          <span className="ml-auto">{up ? 'UP' : 'DOWN'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {sim.sslFallback && sim.sites.onprem === 'online' && (
            <div className="mt-2">
              <Callout tone="warn" icon={ShieldAlert}>
                UDP 4500 is blocked at the DC edge, so the on-prem CE fell back to <b>SSL tunnels</b> over TCP 443. Traffic is still encrypted; IPsec is just the preferred transport.
              </Callout>
            </div>
          )}
        </section>
      </div>
    </ConsoleFrame>
  );
}

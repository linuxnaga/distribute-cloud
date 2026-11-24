import { CheckCircle2, GitMerge, Network, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { Btn, Callout, ConsoleFrame, Toggle } from '../ui.jsx';
import FastTrack from './FastTrack.jsx';

const APPROACHES = [
  {
    id: 'smg-l3',
    title: 'Join both CEs to a Site Mesh Group and route at L3',
    result: 'bad',
    text: 'Route conflict: 10.1.0.0/16 is learned from both acme-aws-use1 and acme-dc1-vmware. The fabric cannot pick a next hop, so Service A traffic is black-holed. Mesh groups give you paths, not a fix for duplicate address space.',
  },
  {
    id: 'reip',
    title: 'Re-IP the data center to 10.50.0.0/16 first',
    result: 'meh',
    text: 'It would work, after a 6-month change program touching 140 apps, firewall rules and DNS. Valid in theory, but this is exactly the project F5 XC lets you avoid.',
  },
  {
    id: 'l7',
    title: 'Publish Service B through a distributed LB with a VIP on the AWS CE',
    result: 'good',
    text: 'Origin pool "inventory-pool" → 10.1.4.17:8443 on acme-dc1-vmware (inside network). HTTP LB "inventory.internal" advertised on Site acme-aws-use1 with VIP 10.1.255.10. Service A calls the local VIP; the on-prem CE opens the connection to the origin. Each side only ever sees its own 10.1.0.0/16.',
  },
];

const SCENARIOS = [
  { q: '40 retail branch CEs need encrypted site-to-site connectivity over broadband, without hairpinning through Regional Edges.', a: 'smg' },
  { q: 'Four CE sites in one colocation facility share a private 100G fabric. You want CE-to-CE forwarding with the lowest overhead and no encryption.', a: 'dcg' },
  { q: 'Branches should only talk to the HQ data center, never to each other.', a: 'smg', note: 'A Site Mesh Group in hub-and-spoke mode.' },
  { q: 'A service in AWS must reach a service in Azure, and both VNets use 172.16.0.0/16.', a: 'lb' },
];
const CHOICES = [
  { id: 'smg', label: 'Site Mesh Group' },
  { id: 'dcg', label: 'DC Cluster Group' },
  { id: 'lb', label: 'L4/L7 Distributed LB' },
];

export default function McnLab() {
  const { state, updateSim, award, emit } = useGame();
  const sim = state.sim;
  const [picked, setPicked] = useState(sim.mcn.overlap ? 'l7' : null);
  const [answers, setAnswers] = useState({});
  const sitesUp = sim.sites.aws === 'online' && sim.sites.onprem === 'online';

  const choose = (a) => {
    setPicked(a.id);
    if (a.result === 'good' && sitesUp) {
      updateSim((x) => ({ ...x, mcn: { ...x.mcn, overlap: true } }));
      award('m2.overlap');
      emit('overlap.resolved');
    }
  };

  const answer = (i, c) => {
    const next = { ...answers, [i]: c };
    setAnswers(next);
    if (SCENARIOS.every((s, j) => next[j] === s.a)) award('m2.mesh');
  };

  const approach = APPROACHES.find((a) => a.id === picked);

  return (
    <ConsoleFrame crumbs={['Multi-Cloud Network Connect', 'Networking', 'Overlap & Mesh Design']} activeNav="Site Mesh Groups" namespace={sim.namespace || 'acme-shop'}>
      <div className="space-y-5">
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <Network className="h-4 w-4 text-emerald" /> Challenge A · Overlapping IPs
          </h3>
          <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs">
            <div className="rounded-lg border border-line bg-ink p-2">
              <div className="text-slate-400">AWS VPC</div>
              <div className="text-amber-300">10.1.0.0/16</div>
              <div className="text-slate-500">Service A · 10.1.4.17</div>
            </div>
            <div className="rounded-lg border border-line bg-ink p-2">
              <div className="text-slate-400">On-Prem DC</div>
              <div className="text-amber-300">10.1.0.0/16</div>
              <div className="text-slate-500">Service B · 10.1.4.17</div>
            </div>
          </div>
          <FastTrack need={['aws', 'onprem']} />
          <p className="text-xs text-slate-400">Service A in AWS must call Service B on-prem. Both networks use the same CIDR, and Service B even has the same IP. Pick an approach:</p>
          <div className="space-y-2">
            {APPROACHES.map((a) => (
              <button
                key={a.id}
                onClick={() => choose(a)}
                className={`w-full rounded-lg border p-2.5 text-left text-sm transition ${picked === a.id ? (a.result === 'good' ? 'border-emerald bg-emerald/10' : a.result === 'meh' ? 'border-amber-400 bg-amber-400/10' : 'border-rose-500 bg-rose-500/10') : 'border-line hover:border-slate-500'}`}
              >
                <span className="text-white">{a.title}</span>
              </button>
            ))}
          </div>
          {approach && (
            <Callout tone={approach.result === 'good' ? (sitesUp ? 'ok' : 'warn') : approach.result === 'meh' ? 'warn' : 'bad'} icon={approach.result === 'good' ? CheckCircle2 : XCircle}>
              {approach.result === 'good' && !sitesUp ? 'Right idea, but both CE sites must be online before the LB can reach the origin. ' : ''}
              {approach.text}
            </Callout>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <GitMerge className="h-4 w-4 text-emerald" /> Challenge B · Site Mesh Group vs DC Cluster Group
          </h3>
          {SCENARIOS.map((s, i) => {
            const a = answers[i];
            return (
              <div key={i} className="rounded-lg border border-line bg-panel/60 p-2.5">
                <p className="text-xs text-slate-300">{s.q}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {CHOICES.map((c) => {
                    const chosen = a === c.id;
                    const right = c.id === s.a;
                    return (
                      <button
                        key={c.id}
                        onClick={() => answer(i, c.id)}
                        className={`rounded-md border px-2 py-1 text-xs font-semibold ${chosen ? (right ? 'border-emerald bg-emerald/15 text-emerald' : 'border-rose-500 bg-rose-500/15 text-rose-300') : 'border-line text-slate-400 hover:text-white'}`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
                {a && a !== s.a && <p className="mt-1.5 text-[11px] text-rose-300">Not quite. Think about encryption, the underlay and whether L3 routing can even work here.</p>}
                {a === s.a && s.note && <p className="mt-1.5 text-[11px] text-emerald">{s.note}</p>}
              </div>
            );
          })}
          {state.awarded['m2.mesh'] && <Callout tone="ok" icon={CheckCircle2}>All scenarios classified. SMG = encrypted CE-to-CE tunnels over any underlay. DCG = unencrypted IP-in-IP for trusted private networks. Overlaps = solve at L4/L7.</Callout>}
          <Toggle
            on={sim.mcn.smg}
            onChange={(v) => updateSim((x) => ({ ...x, mcn: { ...x.mcn, smg: v } }))}
            label="Visualize: Site Mesh Group acme-aws-use1 ↔ acme-dc1-vmware"
            desc="Draws the direct CE-to-CE tunnel on the canvas. Turn on the East-West flow to see traffic skip the Regional Edge."
          />
        </section>
      </div>
    </ConsoleFrame>
  );
}

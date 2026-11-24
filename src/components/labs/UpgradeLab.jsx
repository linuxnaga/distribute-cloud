import { CheckCircle2, Play, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { Btn, Callout, ConsoleFrame } from '../ui.jsx';
import ChoiceGrid, { allOk, initial } from './ChoiceGrid.jsx';

const ITEMS = [
  {
    id: 'first',
    title: 'Which site goes first?',
    desc: 'Fleet: acme-staging-ce (1 node, test traffic), acme-aws-use1 (3 nodes), acme-azure-weu (3 nodes), acme-dc1-vmware (1 node).',
    options: [['aws', 'acme-aws-use1'], ['staging', 'acme-staging-ce'], ['all', 'All sites at once'], ['onprem', 'acme-dc1-vmware']],
    ok: (v) => v === 'staging',
    hint: 'Canary the new release on a site that carries no production traffic, then roll forward.',
  },
  {
    id: 'precheck',
    title: 'Pre-upgrade check',
    options: [['none', 'Skip, the console handles it'], ['health', 'Confirm site health, both RE tunnels up, and no active alerts']],
    ok: (v) => v === 'health',
    hint: 'Never start an upgrade on a degraded site: if one tunnel is already down, a reboot can isolate the site.',
  },
  {
    id: 'cluster',
    title: '3-node clusters (AWS, Azure)',
    options: [['all', 'Upgrade all 3 nodes together'], ['rolling', 'Rolling: one node at a time, wait for it to rejoin']],
    ok: (v) => v === 'rolling',
    hint: 'A rolling upgrade keeps 2 of 3 nodes serving traffic and preserves control-plane quorum.',
  },
  {
    id: 'single',
    title: 'Single-node on-prem site',
    options: [['now', 'Upgrade now, during business hours'], ['window', 'Maintenance window, after shifting its apps to other sites']],
    ok: (v) => v === 'window',
    hint: 'A single node has no peer to take over, so its apps go down while it reboots. Drain it first, in a window.',
  },
  {
    id: 'order',
    title: 'Order of the two upgrade types',
    options: [['both', 'Software and OS in one big step'], ['split', 'Software release first, verify, then the OS upgrade']],
    ok: (v) => v === 'split',
    hint: 'XC upgrades CE software and the host OS separately. One change at a time keeps rollback simple.',
  },
];

export default function UpgradeLab() {
  const { award, emit } = useGame();
  const [vals, setVals] = useState(initial(ITEMS));
  const [checked, setChecked] = useState(false);
  const ok = allOk(ITEMS, vals);
  const run = () => {
    setChecked(true);
    if (ok) {
      award('m1.upgrade');
      emit('upgrade.pass');
    }
  };
  return (
    <ConsoleFrame crumbs={['Multi-Cloud Network Connect', 'Site Management', 'Fleet Upgrades']} activeNav="Site Management" namespace="system">
      <div className="space-y-3">
        <Callout tone="info" icon={RefreshCw}>
          CE software release <span className="font-mono">crt-20261120-1402</span> and OS <span className="font-mono">9.2026.11</span> are available. Plan the fleet upgrade so no production app loses traffic.
        </Callout>
        <ChoiceGrid items={ITEMS} values={vals} checked={checked} onChange={(k, v) => { setVals((s) => ({ ...s, [k]: v })); setChecked(false); }} />
        <Btn onClick={run}>
          <Play className="h-4 w-4" /> Execute upgrade plan
        </Btn>
        {checked && !ok && <Callout tone="bad">The simulated rollout caused an outage. Fix the flagged decisions and run it again.</Callout>}
        {checked && ok && (
          <div className="space-y-2">
            <div className="rounded-lg border border-line bg-black/60 p-3 font-mono text-[11px] leading-relaxed text-slate-300">
              <div>✓ acme-staging-ce: software → crt-20261120 · smoke tests passed</div>
              <div>✓ acme-aws-use1: node-1 → node-2 → node-3 (2/3 serving throughout)</div>
              <div>✓ acme-azure-weu: rolling, 0 dropped requests</div>
              <div>✓ acme-dc1-vmware: drained to Azure at 02:00, upgraded, traffic restored</div>
              <div className="text-emerald">✓ OS 9.2026.11 rolled out in a second wave · fleet compliant</div>
            </div>
            <Callout tone="ok" icon={CheckCircle2}>Zero-downtime fleet upgrade: canary first, healthy sites only, rolling clusters, drained single nodes, one change at a time.</Callout>
          </div>
        )}
      </div>
    </ConsoleFrame>
  );
}

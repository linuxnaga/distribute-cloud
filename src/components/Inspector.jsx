import { Info, Route, Gauge, X } from 'lucide-react';
import { COMPONENTS } from '../data/curriculum.js';
import { useGame } from '../state/GameContext.jsx';
import { attackBlockRate } from '../sim/security.js';

const TUN = { aws: 2, azure: 2, onprem: 2 };

function resolve(token, sim) {
  if (typeof token !== 'string') return token;
  const online = Object.values(sim.sites).filter((s) => s === 'online').length;
  if (token === 'sites') return `${online} / 3 online`;
  if (token === 'tunnels') return `${online * 2} IPsec`;
  if (token === 'rps') return sim.lb ? '2,410' : '— (no LB yet)';
  if (token === 'err') return sim.lb ? '0.12%' : '—';
  if (token === 'lat') return sim.lb ? '41 ms' : '—';
  if (token === 'origins') return sim.pool ? `${sim.sites.onprem === 'online' ? 2 : 0} / 2` : '— (no pool yet)';
  if (token === 'pods') return sim.appstack.deployed ? `${sim.appstack.replicas * sim.appstack.sites.length}` : '0';
  if (token === 'vsites') return sim.appstack.deployed ? sim.appstack.sites.join(', ') : 'not deployed';
  if (token === 'ewrps') return sim.mcn.overlap ? '310' : '0 (blocked by overlap)';
  if (token === 'waf') return { off: 'Off', monitor: 'Monitoring', block: 'Blocking' }[sim.security.waf];
  if (token === 'bot') return sim.security.bot ? 'Enabled' : 'Disabled';
  if (token === 'blocked') return sim.lastBurst ? `${Math.round(attackBlockRate(sim.security) * 100)}% of attacks` : 'no burst yet';
  if (token.startsWith('site:')) {
    const s = sim.sites[token.slice(5)];
    return s === 'online' ? 'Online' : s === 'provisioning' ? 'Provisioning' : 'Pending approval';
  }
  if (token.startsWith('tun:')) {
    const site = token.slice(4);
    return sim.sites[site] === 'online' ? `${TUN[site]} / 2 up` : '0 / 2 up';
  }
  return token;
}

export default function Inspector({ nodeId, onClose }) {
  const { state } = useGame();
  const c = COMPONENTS[nodeId];
  if (!c) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-line bg-panel/40 p-4 text-sm text-slate-400">
        <Info className="h-5 w-5 shrink-0 text-cyan" />
        Click any component in the diagram (an RE PoP, a CE cluster, the HTTP LB, the Origin Pool, the WAAP shield or a workload) to open its inspector card.
      </div>
    );
  }
  return (
    <div className="toast-in rounded-xl border border-cyan/40 bg-panel p-4 shadow-[0_0_30px_rgba(6,182,212,.08)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan">{c.kind}</div>
          <div className="text-base font-bold text-white">{c.name}</div>
        </div>
        <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-panel2 hover:text-white" aria-label="Close inspector">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Info className="h-3.5 w-3.5 text-cyan" /> Operational role
          </div>
          <p className="text-slate-400">{c.role}</p>
        </div>
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Route className="h-3.5 w-3.5 text-emerald" /> Routing behavior
          </div>
          <p className="text-slate-400">{c.routing}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {c.metrics.map(([k, v]) => (
          <div key={k} className="rounded-lg border border-line bg-ink/60 px-2.5 py-2">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-500">
              <Gauge className="h-3 w-3" /> {k}
            </div>
            <div className="mt-0.5 truncate font-mono text-sm text-white" title={String(resolve(v, state.sim))}>
              {resolve(v, state.sim)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import {
  Activity,
  ArrowLeftRight,
  ArrowDownUp,
  Boxes,
  Bug,
  Building2,
  Cloud,
  Database,
  Eye,
  Layers,
  Lock,
  MonitorSmartphone,
  Radio,
  Scale,
  Server,
  Shield,
  Skull,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import { attackBlockRate } from '../sim/security.js';
import { reltFor } from '../sim/metrics.js';

// ---- Static geometry (viewBox 1000 × 660) ----
export const NODES = {
  console: { x: 500, y: 50, w: 340, h: 54, label: 'SaaS Control & Mgmt Plane', sub: 'F5 XC Console · Global Controller', icon: Radio, color: '#a78bfa' },
  users: { x: 82, y: 220, w: 140, h: 54, label: 'End Users', sub: 'Global clients', icon: MonitorSmartphone, color: '#06b6d4' },
  attackers: { x: 82, y: 360, w: 140, h: 54, label: 'Attackers', sub: 'Bots · scanners', icon: Skull, color: '#f43f5e' },
  policy: { x: 232, y: 250, w: 62, h: 62, label: 'WAAP', sub: 'Policy', icon: Shield, color: '#f59e0b', round: true },
  're-ash': { x: 350, y: 250, w: 160, h: 58, label: 'RE · Ashburn', sub: 'Anycast PoP', icon: Server, color: '#06b6d4' },
  're-fra': { x: 560, y: 250, w: 160, h: 58, label: 'RE · Frankfurt', sub: 'Anycast PoP', icon: Server, color: '#06b6d4' },
  're-sin': { x: 775, y: 250, w: 160, h: 58, label: 'RE · Singapore', sub: 'Anycast PoP', icon: Server, color: '#06b6d4' },
  hlb: { x: 350, y: 318, w: 150, h: 36, label: 'HTTP LB', sub: 'shop.acme.com', icon: Scale, color: '#e4002b', small: true },
  'ce-aws': { x: 215, y: 470, w: 190, h: 60, label: 'CE · AWS VPC', sub: '3-node cluster', icon: Cloud, color: '#10b981' },
  'ce-azure': { x: 500, y: 470, w: 190, h: 60, label: 'CE · Azure VNet', sub: 'App Stack site', icon: Cloud, color: '#10b981' },
  'ce-onprem': { x: 785, y: 470, w: 190, h: 60, label: 'CE · On-Prem DC', sub: 'VMware single node', icon: Building2, color: '#10b981' },
  'svc-a': { x: 215, y: 588, w: 160, h: 40, label: 'Service A', sub: 'checkout-api', icon: Boxes, color: '#94a3b8', small: true },
  vk8s: { x: 500, y: 588, w: 175, h: 40, label: 'vK8s Workload', sub: 'inventory-cache', icon: Boxes, color: '#a855f7', small: true },
  'svc-b': { x: 785, y: 588, w: 160, h: 40, label: 'Service B', sub: 'inventory-db-api', icon: Database, color: '#94a3b8', small: true },
  pool: { x: 920, y: 380, w: 136, h: 38, label: 'Origin Pool', sub: 'on ce-onprem', icon: Layers, color: '#e4002b', small: true },
};

// CE → its two nearest REs
export const TUNNELS = {
  aws: ['re-ash', 're-fra'],
  azure: ['re-fra', 're-sin'],
  onprem: ['re-fra', 're-sin'],
};
const SITE_NODE = { aws: 'ce-aws', azure: 'ce-azure', onprem: 'ce-onprem' };

const P = (id, dx = 0, dy = 0) => `${NODES[id].x + dx},${NODES[id].y + dy}`;

const PATHS = {
  nsFull: `M${P('users', 55)} L${P('policy')} L${P('re-ash')} L${P('re-fra')} L${P('ce-onprem', 0, -30)} L${P('svc-b', 0, -20)}`,
  nsCut: `M${P('users', 55)} L${P('policy')} L${P('re-ash')} L${P('re-fra')}`,
  ewViaRe: `M${P('svc-a', 0, -20)} L${P('ce-aws', 0, 30)} L${P('ce-aws', 0, -30)} L${P('re-fra')} L${P('ce-onprem', 0, -30)} L${P('ce-onprem', 0, 30)} L${P('svc-b', 0, -20)}`,
  ewSmg: `M${P('svc-a', 0, -20)} L${P('ce-aws', 0, 30)} L${P('ce-aws', 95, 0)} Q500,400 ${P('ce-onprem', -95, 0)} L${P('ce-onprem', 0, 30)} L${P('svc-b', 0, -20)}`,
  ewCut: `M${P('svc-a', 0, -20)} L${P('ce-aws', 0, 30)}`,
  atkBlocked: `M${P('attackers', 55)} L${P('policy')}`,
  atkLeak: `M${P('attackers', 55)} L${P('policy')} L${P('re-ash')} L${P('re-fra')} L${P('ce-onprem', 0, -30)} L${P('svc-b', 0, -20)}`,
};

const LAYERS = [
  { id: 'cp', label: 'Control Plane', icon: Radio, award: 'm1.layer.cp' },
  { id: 'dp', label: 'Data Plane', icon: Activity },
  { id: 'tun', label: 'Tunnel Status', icon: Lock },
  { id: 'waap', label: 'WAAP Enforcement', icon: Shield },
  { id: 'relt', label: 'RELT Telemetry', icon: Eye },
];

const FLOWS = [
  { id: 'ns', label: 'North-South', icon: ArrowDownUp, color: '#06b6d4' },
  { id: 'ew', label: 'East-West', icon: ArrowLeftRight, color: '#10b981' },
  { id: 'attack', label: 'Attack Traffic', icon: Bug, color: '#f43f5e' },
];

function Packets({ pathId, color, count = 3, dur = 3.2, r = 5, keyPrefix }) {
  return Array.from({ length: count }).map((_, i) => (
    <circle key={`${keyPrefix}-${i}`} r={r} fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
      <animateMotion dur={`${dur}s`} begin={`${(i * dur) / count}s`} repeatCount="indefinite" rotate="auto">
        <mpath href={`#${pathId}`} />
      </animateMotion>
    </circle>
  ));
}

function Node({ id, n, focused, selected, onSelect, status, dim }) {
  const IconC = n.icon;
  const color = status === 'pending' ? '#64748b' : status === 'provisioning' ? '#f59e0b' : n.color;
  const x = n.x - n.w / 2;
  const y = n.y - n.h / 2;
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Inspect ${n.label}`}
      onClick={() => onSelect(id)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(id)}
      className="cursor-pointer outline-none"
      style={{ opacity: dim ? 0.5 : 1, transition: 'opacity .3s' }}
    >
      {(focused || selected) && (
        <rect x={x - 5} y={y - 5} width={n.w + 10} height={n.h + 10} rx={n.round ? n.w : 14} fill="none" stroke={color} strokeOpacity={selected ? 0.9 : 0.35} strokeWidth={selected ? 2 : 1.5} strokeDasharray={selected ? '0' : '4 4'} />
      )}
      <rect x={x} y={y} width={n.w} height={n.h} rx={n.round ? n.w : 10} fill="#0f172a" stroke={color} strokeWidth={1.5} style={{ filter: focused ? `drop-shadow(0 0 10px ${color}55)` : 'none' }} />
      {n.round ? (
        <>
          <IconC x={n.x - 11} y={n.y - 17} width={22} height={22} color={color} />
          <text x={n.x} y={n.y + 20} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fde68a">
            {n.label}
          </text>
        </>
      ) : (
        <>
          <IconC x={x + 9} y={n.y - 10} width={20} height={20} color={color} />
          <text x={x + 34} y={n.small ? n.y + 5 : n.y - 3} fontSize={n.small ? 14 : 15} fontWeight="700" fill="#f1f5f9">
            {n.label}
          </text>
          {!n.small && (
            <text x={x + 34} y={n.y + 15} fontSize="12" fill="#94a3b8">
              {status === 'pending' ? 'Pending registration' : status === 'provisioning' ? 'Provisioning…' : n.sub}
            </text>
          )}
        </>
      )}
    </g>
  );
}

export default function FlowCanvas({ module, selected, onSelect }) {
  const { state, award } = useGame();
  const sim = state.sim;
  const [layers, setLayers] = useState(() => ({ cp: false, dp: true, tun: true, waap: module.id === 'm3', relt: module.id === 'm4', ...(module.layers || {}) }));
  const [flows, setFlows] = useState(() => Object.fromEntries(FLOWS.map((f) => [f.id, module.defaultFlows.includes(f.id)])));

  const focus = new Set(module.focus);
  const siteStatus = (site) => sim.sites[site];
  const onpremUp = siteStatus('onprem') === 'online';
  const ewUp = onpremUp && siteStatus('aws') === 'online';
  const smg = sim.mcn.smg;
  const blockRate = attackBlockRate(sim.security);
  const attackBlocked = blockRate >= 0.999;
  const metrics = useMemo(() => reltFor(sim), [sim]);
  const vk8sSites = sim.appstack.deployed ? sim.appstack.sites : [];

  // Award flow tasks once a flow actually completes end to end.
  useEffect(() => {
    if (layers.dp && flows.ns && onpremUp) award('m1.flow.ns');
    if (layers.dp && flows.ew && ewUp) award('m2.flow.ew');
    if (layers.waap && flows.attack && attackBlocked) award('m3.layer.waap');
    if (layers.relt && sim.appstack.fault && sim.appstack.deployed) award('m4.flow.relt');
  }, [layers.dp, layers.waap, layers.relt, flows.ns, flows.ew, flows.attack, onpremUp, ewUp, attackBlocked, sim.appstack.fault, sim.appstack.deployed, award]);

  const toggleLayer = (l) => {
    setLayers((s) => ({ ...s, [l.id]: !s[l.id] }));
    if (!layers[l.id] && l.award) award(l.award);
  };
  const toggleFlow = (f) => {
    setFlows((s) => ({ ...s, [f.id]: !s[f.id] }));
    if (!flows[f.id] && f.award) award(f.award);
  };

  const tunnelColor = (status) => (status === 'online' ? '#10b981' : status === 'provisioning' ? '#f59e0b' : '#475569');

  return (
    <div className="flex h-full flex-col rounded-xl border border-line bg-panel/70">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Flows</span>
        {FLOWS.map((f) => (
          <button
            key={f.id}
            onClick={() => toggleFlow(f)}
            aria-pressed={flows[f.id]}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${flows[f.id] ? 'text-white' : 'border-line text-slate-400 hover:text-slate-200'}`}
            style={flows[f.id] ? { borderColor: f.color, background: `${f.color}22` } : undefined}
          >
            <f.icon className="h-3.5 w-3.5" style={{ color: f.color }} />
            {f.label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-line" />
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Layers</span>
        {LAYERS.map((l) => (
          <button
            key={l.id}
            onClick={() => toggleLayer(l)}
            aria-pressed={layers[l.id]}
            className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition ${layers[l.id] ? 'border-cyan/60 bg-cyan/10 text-cyan' : 'border-line text-slate-400 hover:text-slate-200'}`}
          >
            <l.icon className="h-3.5 w-3.5" />
            {l.label}
          </button>
        ))}
      </div>

      <div className="grid-bg relative flex-1 overflow-hidden rounded-b-xl">
        <svg viewBox="0 0 1000 660" className="h-full w-full" role="img" aria-label={`${module.short} architecture and traffic flow diagram`}>
          <defs>
            {Object.entries(PATHS).map(([id, d]) => (
              <path key={id} id={id} d={d} fill="none" />
            ))}
            <linearGradient id="bb" x1="0" x2="1">
              <stop offset="0" stopColor="#06b6d4" stopOpacity=".16" />
              <stop offset="1" stopColor="#e4002b" stopOpacity=".10" />
            </linearGradient>
          </defs>

          {/* Global backbone band */}
          <rect x={190} y={180} width={790} height={170} rx={22} fill="url(#bb)" stroke="#06b6d4" strokeOpacity=".35" strokeDasharray="3 6" />
          <text x={205} y={202} fontSize="13" fontWeight="700" fill="#67e8f9" letterSpacing="1.5">
            F5 GLOBAL PRIVATE NETWORK · ANYCAST
          </text>
          {layers.dp && (
            <line x1={NODES['re-ash'].x + 60} y1={250} x2={NODES['re-sin'].x - 60} y2={250} stroke="#06b6d4" strokeWidth={3} strokeOpacity={0.55} className="flow-dash" />
          )}

          {/* Customer environments band */}
          <rect x={110} y={425} width={875} height={228} rx={22} fill="#10b98108" stroke="#10b981" strokeOpacity=".25" strokeDasharray="3 6" />
          <text x={128} y={644} fontSize="13" fontWeight="700" fill="#6ee7b7" letterSpacing="1.5">
            CUSTOMER CLOUDS & DATA CENTERS
          </text>

          {/* Control plane links */}
          {layers.cp &&
            ['re-ash', 're-fra', 're-sin', 'ce-aws', 'ce-azure', 'ce-onprem'].map((id) => (
              <path
                key={id}
                d={`M${NODES.console.x},${NODES.console.y + 24} C${NODES.console.x},${NODES.console.y + 90} ${NODES[id].x},${NODES[id].y - 110} ${NODES[id].x},${NODES[id].y - NODES[id].h / 2}`}
                fill="none"
                stroke="#a78bfa"
                strokeOpacity=".55"
                strokeWidth={1.3}
                className="flow-dash-slow"
              />
            ))}

          {/* Tunnels CE ↔ RE */}
          {Object.entries(TUNNELS).flatMap(([site, res]) =>
            res.map((re, i) => {
              const st = siteStatus(site);
              const ce = NODES[SITE_NODE[site]];
              const r = NODES[re];
              const x1 = ce.x + (i === 0 ? -18 : 18);
              const mx = (x1 + r.x) / 2;
              const my = (ce.y - 30 + r.y + 29) / 2;
              return (
                <g key={`${site}-${re}`}>
                  <line
                    x1={x1}
                    y1={ce.y - 30}
                    x2={r.x}
                    y2={r.y + 29}
                    stroke={tunnelColor(st)}
                    strokeWidth={st === 'online' ? 2.5 : 1.5}
                    strokeOpacity={layers.tun ? 0.9 : 0.35}
                    strokeDasharray={st === 'online' ? undefined : '5 5'}
                  />
                  {layers.tun && (
                    <g>
                      <circle cx={mx} cy={my} r={9} fill="#0b1120" stroke={tunnelColor(st)} />
                      <Lock x={mx - 5} y={my - 5} width={10} height={10} color={tunnelColor(st)} />
                    </g>
                  )}
                </g>
              );
            }),
          )}

          {/* Site Mesh Group direct link */}
          {smg && (
            <path d={`M${P('ce-aws', 95, 0)} Q500,400 ${P('ce-onprem', -95, 0)}`} fill="none" stroke="#34d399" strokeWidth={2} strokeDasharray="8 4" className="flow-dash" />
          )}

          {/* Logical links: LB → pool → origin */}
          <path d={`M${P('hlb', 75)} C640,330 860,330 ${P('pool', -68)}`} fill="none" stroke="#e4002b" strokeOpacity={sim.pool ? 0.6 : 0.2} strokeDasharray="2 4" />
          <path d={`M${P('pool', 0, 20)} C930,520 860,590 ${P('svc-b', 80)}`} fill="none" stroke="#e4002b" strokeOpacity={sim.pool ? 0.6 : 0.2} strokeDasharray="2 4" />
          <line x1={NODES['ce-aws'].x} y1={500} x2={NODES['svc-a'].x} y2={568} stroke="#334155" strokeWidth={1.5} />
          <line x1={NODES['ce-azure'].x} y1={500} x2={NODES.vk8s.x} y2={568} stroke="#334155" strokeWidth={1.5} />
          <line x1={NODES['ce-onprem'].x} y1={500} x2={NODES['svc-b'].x} y2={568} stroke="#334155" strokeWidth={1.5} />
          <line x1={NODES.users.x + 55} y1={NODES.users.y} x2={NODES.policy.x - 31} y2={NODES.policy.y} stroke="#06b6d4" strokeOpacity=".35" />
          <line x1={NODES.attackers.x + 55} y1={NODES.attackers.y} x2={NODES.policy.x - 20} y2={NODES.policy.y + 24} stroke="#f43f5e" strokeOpacity=".35" />
          <line x1={NODES.policy.x + 31} y1={NODES.policy.y} x2={NODES['re-ash'].x - 60} y2={NODES['re-ash'].y} stroke="#06b6d4" strokeOpacity=".35" />

          {/* Nodes */}
          {Object.entries(NODES).map(([id, n]) => {
            const site = Object.entries(SITE_NODE).find(([, v]) => v === id)?.[0];
            if (id === 'policy' && !layers.waap)
              return (
                <g key={id} opacity={0.35} onClick={() => onSelect(id)} className="cursor-pointer">
                  <circle cx={n.x} cy={n.y} r={14} fill="#0f172a" stroke="#475569" strokeDasharray="3 3" />
                </g>
              );
            return (
              <Node
                key={id}
                id={id}
                n={n}
                focused={focus.has(id)}
                selected={selected === id}
                onSelect={onSelect}
                status={site ? siteStatus(site) : undefined}
                dim={focus.size > 0 && !focus.has(id) && selected !== id}
              />
            );
          })}

          {/* vK8s pods on deployed sites */}
          {vk8sSites.map((s) => {
            const node = NODES[s === 're-sin' ? 're-sin' : SITE_NODE[s]];
            if (!node) return null;
            return Array.from({ length: Math.min(sim.appstack.replicas, 4) }).map((_, i) => (
              <polygon
                key={`${s}-${i}`}
                points={hex(node.x + node.w / 2 - 10 - i * 13, node.y - node.h / 2 - 2, 6)}
                fill={sim.appstack.fault === s ? '#f43f5e' : '#a855f7'}
                stroke="#0b1120"
              />
            ));
          })}

          {/* RELT overlay */}
          {layers.relt &&
            Object.entries(metrics.nodes).map(([id, m]) => {
              const n = NODES[id];
              const bad = m.lat > 250 || m.err > 2;
              return (
                <g key={`relt-${id}`}>
                  <rect x={n.x - 80} y={n.y + n.h / 2 + 3} width={160} height={20} rx={4} fill={bad ? '#4c0519' : '#0b1120'} stroke={bad ? '#f43f5e' : '#334155'} />
                  <text x={n.x} y={n.y + n.h / 2 + 17.5} textAnchor="middle" fontSize="12" fontFamily="monospace" fill={bad ? '#fda4af' : '#94a3b8'}>
                    {m.rps}rps · {m.err}% · {m.lat}ms
                  </text>
                </g>
              );
            })}

          {/* Packet flows */}
          {layers.dp && flows.ns && (
            <>
              <Packets keyPrefix={`ns-${onpremUp}`} pathId={onpremUp ? 'nsFull' : 'nsCut'} color="#22d3ee" dur={onpremUp ? 4 : 2.6} />
              {!onpremUp && <XMark x={NODES['re-fra'].x + 10} y={NODES['re-fra'].y + 50} label="Origin site offline" />}
            </>
          )}
          {layers.dp && flows.ew && (
            <>
              <Packets keyPrefix={`ew-${ewUp}-${smg}`} pathId={ewUp ? (smg ? 'ewSmg' : 'ewViaRe') : 'ewCut'} color="#34d399" dur={ewUp ? 4.4 : 1.6} />
              {!ewUp && <XMark x={NODES['ce-aws'].x + 40} y={NODES['ce-aws'].y + 40} label="CE sites not registered" />}
            </>
          )}
          {flows.attack && (
            <>
              <Packets keyPrefix={`atk-${attackBlocked}`} pathId={attackBlocked ? 'atkBlocked' : 'atkLeak'} color="#f43f5e" count={4} dur={attackBlocked ? 1.8 : 4} r={4.5} />
              {attackBlocked && layers.waap && (
                <circle cx={NODES.policy.x} cy={NODES.policy.y} r={6} fill="none" stroke="#f59e0b" strokeWidth={2} className="burst" />
              )}
              {!attackBlocked && (
                <g>
                  <circle cx={NODES['svc-b'].x} cy={NODES['svc-b'].y} r={30} fill="#f43f5e" opacity=".12" className="burst" />
                  <text x={NODES['svc-b'].x} y={NODES['svc-b'].y - 30} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#fda4af">
                    {blockRate > 0 ? `${Math.round((1 - blockRate) * 100)}% of attacks leaking` : 'Attacks reaching origin!'}
                  </text>
                </g>
              )}
            </>
          )}
        </svg>
      </div>
      <Legend />
    </div>
  );
}

function XMark({ x, y, label }) {
  return (
    <g>
      <circle cx={x} cy={y} r={9} fill="#1e293b" stroke="#f43f5e" />
      <path d={`M${x - 4},${y - 4} L${x + 4},${y + 4} M${x + 4},${y - 4} L${x - 4},${y + 4}`} stroke="#f43f5e" strokeWidth={2} />
      <text x={x + 14} y={y + 5} fontSize="12.5" fontWeight="600" fill="#fda4af">
        {label}
      </text>
    </g>
  );
}

function hex(cx, cy, r) {
  return Array.from({ length: 6 })
    .map((_, i) => {
      const a = (Math.PI / 3) * i + Math.PI / 6;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    })
    .join(' ');
}

function Legend() {
  const items = [
    ['#22d3ee', 'N-S packet'],
    ['#34d399', 'E-W packet'],
    ['#f43f5e', 'Attack'],
    ['#10b981', 'Tunnel up'],
    ['#475569', 'Tunnel pending'],
    ['#a78bfa', 'Control plane'],
  ];
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-line px-3 py-1.5 text-[10px] text-slate-400">
      {items.map(([c, l]) => (
        <span key={l} className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: c }} />
          {l}
        </span>
      ))}
    </div>
  );
}

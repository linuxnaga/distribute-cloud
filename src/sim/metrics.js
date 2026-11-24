// RELT (Requests, Errors, Latency, Throughput) model derived from sim state.
const BASE = {
  're-ash': { rps: 2400, err: 0.1, lat: 9 },
  're-sin': { rps: 900, err: 0.1, lat: 11 },
  'ce-aws': { rps: 640, err: 0.2, lat: 18 },
  'ce-azure': { rps: 520, err: 0.2, lat: 21 },
  'ce-onprem': { rps: 880, err: 0.3, lat: 24 },
  vk8s: { rps: 410, err: 0.1, lat: 12 },
};
const SITE_NODE = { aws: 'ce-aws', azure: 'ce-azure', onprem: 'ce-onprem' };

export function reltFor(sim) {
  const nodes = {};
  for (const [id, b] of Object.entries(BASE)) {
    const site = Object.entries(SITE_NODE).find(([, v]) => v === id)?.[0];
    if (site && sim.sites[site] !== 'online') continue;
    if (id === 'vk8s' && !sim.appstack.deployed) continue;
    nodes[id] = { ...b };
    const faultHere = sim.appstack.fault && (sim.appstack.fault === site || sim.appstack.fault === id);
    if (faultHere) nodes[id] = { rps: Math.round(b.rps * 0.7), err: 4.2, lat: 640 };
  }
  return { nodes };
}

// Per-service table for the App Stack lab dashboard.
export const SERVICES = [
  { id: 'aws', name: 'inventory-cache @ ce-aws', site: 'aws' },
  { id: 'azure', name: 'inventory-cache @ ce-azure', site: 'azure' },
  { id: 'onprem', name: 'inventory-cache @ ce-onprem', site: 'onprem' },
  { id: 're-sin', name: 'inventory-cache @ re-singapore', site: 're-sin' },
];

export function serviceMetrics(site, fault, tick) {
  const seed = site.length * 7 + tick;
  const jitter = (n) => Math.sin(seed * 1.7 + n) * 0.5 + 0.5;
  if (fault === site) {
    return { rps: Math.round(300 + jitter(1) * 40), err: +(3.8 + jitter(2) * 1.2).toFixed(1), lat: Math.round(580 + jitter(3) * 120), thr: +(14 + jitter(4) * 3).toFixed(1) };
  }
  return { rps: Math.round(420 + jitter(1) * 90), err: +(0.1 + jitter(2) * 0.25).toFixed(2), lat: Math.round(14 + jitter(3) * 10), thr: +(38 + jitter(4) * 9).toFixed(1) };
}

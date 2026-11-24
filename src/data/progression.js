// Ranks, badges and the XP task registry. Every XP award is keyed by a task id,
// so repeating an action never farms XP twice.

export const RANKS = [
  { level: 1, title: 'Edge Explorer', minXp: 0 },
  { level: 2, title: 'Tunnel Technician', minXp: 250 },
  { level: 3, title: 'Mesh Weaver', minXp: 1000 },
  { level: 4, title: 'Edge Sentinel', minXp: 2000 },
  { level: 5, title: 'Distributed Cloud Architect', minXp: 3100 },
];

export const BADGES = [
  {
    id: 'mesh',
    module: 'm1',
    name: 'Global Mesh & RE/CE Tunnels',
    short: 'Global Mesh',
    color: '#06b6d4',
    icon: 'Network',
    criteria: 'Finish every Module 1 lab task and answer all Module 1 knowledge checks correctly.',
  },
  {
    id: 'mcn',
    module: 'm2',
    name: 'Multi-Cloud Networking (MCN)',
    short: 'MCN',
    color: '#10b981',
    icon: 'Waypoints',
    criteria: 'Finish every Module 2 lab task and answer all Module 2 knowledge checks correctly.',
  },
  {
    id: 'waap',
    module: 'm3',
    name: 'WAAP & Bot Defense',
    short: 'WAAP',
    color: '#f59e0b',
    icon: 'ShieldCheck',
    criteria: 'Finish every Module 3 lab task and answer all Module 3 knowledge checks correctly.',
  },
  {
    id: 'appstack',
    module: 'm4',
    name: 'App Stack Edge Orchestration',
    short: 'App Stack',
    color: '#a855f7',
    icon: 'Boxes',
    criteria: 'Finish every Module 4 lab task and answer all Module 4 knowledge checks correctly.',
  },
];

// kind: explore | lab | quiz | mission. Badge criteria use lab + quiz tasks.
export const TASKS = [
  // Module 1
  { id: 'm1.inspect', module: 'm1', kind: 'explore', xp: 30, label: 'Inspect 3 architecture components' },
  { id: 'm1.flow.ns', module: 'm1', kind: 'explore', xp: 20, label: 'Watch a North-South flow reach the on-prem origin' },
  { id: 'm1.layer.cp', module: 'm1', kind: 'explore', xp: 20, label: 'Reveal the Control Plane layer on the canvas' },
  { id: 'm1.site.aws', module: 'm1', kind: 'lab', xp: 60, label: 'Approve the AWS CE site registration' },
  { id: 'm1.site.onprem', module: 'm1', kind: 'lab', xp: 60, label: 'Approve the On-Prem CE site registration' },
  { id: 'm1.tunnels', module: 'm1', kind: 'lab', xp: 40, label: 'Bring all CE→RE tunnels online' },
  { id: 'm1.gcp', module: 'm1', kind: 'lab', xp: 60, label: 'Deploy an HA GCP cloud CE site' },
  { id: 'm1.rbac', module: 'm1', kind: 'lab', xp: 60, label: 'Pass a least-privilege namespace access review' },
  { id: 'm1.upgrade', module: 'm1', kind: 'lab', xp: 60, label: 'Plan a zero-downtime CE fleet upgrade' },
  { id: 'm1.azure', module: 'm1', kind: 'lab', xp: 60, label: 'Deploy a zone-redundant Azure hub CE' },
  { id: 'm1.vsite', module: 'm1', kind: 'lab', xp: 60, label: 'Target sites precisely with label selectors' },
  { id: 'm1.api', module: 'm1', kind: 'lab', xp: 60, label: 'Automate XC safely with scoped, expiring credentials' },

  // Module 2
  { id: 'm2.flow.ew', module: 'm2', kind: 'explore', xp: 20, label: 'Watch an East-West flow from AWS to On-Prem' },
  { id: 'm2.ns', module: 'm2', kind: 'lab', xp: 30, label: 'Create an application Namespace' },
  { id: 'm2.pool', module: 'm2', kind: 'lab', xp: 50, label: 'Create a private Origin Pool on a CE site' },
  { id: 'm2.lb', module: 'm2', kind: 'lab', xp: 60, label: 'Advertise an HTTP LB on the RE Anycast network' },
  { id: 'm2.test', module: 'm2', kind: 'lab', xp: 40, label: 'Send live test traffic through the LB' },
  { id: 'm2.overlap', module: 'm2', kind: 'lab', xp: 50, label: 'Resolve overlapping IPs between AWS and On-Prem' },
  { id: 'm2.mesh', module: 'm2', kind: 'lab', xp: 50, label: 'Classify all SMG vs DCG scenarios correctly' },
  { id: 'm2.connector', module: 'm2', kind: 'lab', xp: 40, label: 'Pick the right Network Connector for VPC egress' },
  { id: 'm2.fw', module: 'm2', kind: 'lab', xp: 60, label: 'Build a least-privilege Network Firewall policy' },
  { id: 'm2.gslb', module: 'm2', kind: 'lab', xp: 60, label: 'Route DNS to the nearest healthy region with fast failover' },
  { id: 'm2.segments', module: 'm2', kind: 'lab', xp: 60, label: 'Segment prod, dev, PCI and shared services' },
  { id: 'm2.bgp', module: 'm2', kind: 'lab', xp: 60, label: 'Advertise a VIP to DC routers with BGP' },
  { id: 'm2.tcp', module: 'm2', kind: 'lab', xp: 60, label: 'Publish a non-HTTP app with a TCP load balancer' },
  { id: 'm2.routes', module: 'm2', kind: 'lab', xp: 60, label: 'Route requests by path and header, with redirects and rewrites' },
  { id: 'm2.health', module: 'm2', kind: 'lab', xp: 60, label: 'Detect sick origins fast and keep users on nearby ones' },
  { id: 'm2.tgw', module: 'm2', kind: 'lab', xp: 60, label: 'Connect 12 VPCs through one AWS TGW site' },

  // Module 3
  { id: 'm3.layer.waap', module: 'm3', kind: 'explore', xp: 20, label: 'Watch attack packets die at the RE WAAP shield' },
  { id: 'm3.sqli', module: 'm3', kind: 'lab', xp: 40, label: 'Block OWASP SQLi at the Regional Edge' },
  { id: 'm3.bot', module: 'm3', kind: 'lab', xp: 40, label: 'Stop the credential stuffing bots' },
  { id: 'm3.ddos', module: 'm3', kind: 'lab', xp: 40, label: 'Mitigate the L7 DDoS spike' },
  { id: 'm3.api', module: 'm3', kind: 'lab', xp: 40, label: 'Catch the Shadow API probe' },
  { id: 'm3.clean', module: 'm3', kind: 'lab', xp: 60, label: 'Run a burst with zero leaks and ≥95% legit success' },
  { id: 'm3.policy', module: 'm3', kind: 'lab', xp: 60, label: 'Build a Service Policy that passes every test request' },
  { id: 'm3.oas', module: 'm3', kind: 'lab', xp: 60, label: 'Triage shadow APIs and enforce the OAS spec' },
  { id: 'm3.mtls', module: 'm3', kind: 'lab', xp: 60, label: 'Lock a partner API down with mTLS' },
  { id: 'm3.mud', module: 'm3', kind: 'lab', xp: 60, label: 'Tune Malicious User Detection with zero false positives' },
  { id: 'm3.ratelimit', module: 'm3', kind: 'lab', xp: 60, label: 'Set rate limits that stop abusers, not customers' },
  { id: 'm3.csd', module: 'm3', kind: 'lab', xp: 60, label: 'Stop a checkout card skimmer with Client-Side Defense' },
  { id: 'm3.waftune', module: 'm3', kind: 'lab', xp: 60, label: 'Fix WAF false positives without opening holes' },
  { id: 'm3.dataguard', module: 'm3', kind: 'lab', xp: 60, label: 'Mask leaked card and ID numbers at the edge' },
  { id: 'm3.threatintel', module: 'm3', kind: 'lab', xp: 60, label: 'Block bad IPs and scope trusted-client exceptions narrowly' },
  { id: 'm3.campaigns', module: 'm3', kind: 'lab', xp: 60, label: 'Stage new signatures and block active threat campaigns' },
  { id: 'm3.botadv', module: 'm3', kind: 'lab', xp: 60, label: 'Protect every abused endpoint, including the mobile app' },

  // Module 4
  { id: 'm4.flow.relt', module: 'm4', kind: 'explore', xp: 20, label: 'Spot a faulty edge on the canvas RELT overlay' },
  { id: 'm4.deploy', module: 'm4', kind: 'lab', xp: 60, label: 'Deploy a vK8s workload to a virtual site' },
  { id: 'm4.multisite', module: 'm4', kind: 'lab', xp: 40, label: 'Run the workload on 3 or more edge sites' },
  { id: 'm4.diagnose', module: 'm4', kind: 'lab', xp: 50, label: 'Diagnose the latency fault from RELT metrics' },
  { id: 'm4.siem', module: 'm4', kind: 'lab', xp: 40, label: 'Stream an alert to your SIEM' },
  { id: 'm4.synth', module: 'm4', kind: 'lab', xp: 60, label: 'Find and fix a regional outage with Synthetic Monitoring' },
  { id: 'm4.cdn', module: 'm4', kind: 'lab', xp: 60, label: 'Cache at the edge with no stale prices or data leaks' },
  { id: 'm4.alerts', module: 'm4', kind: 'lab', xp: 60, label: 'Route alerts by severity and stop alert storms' },
  { id: 'm4.blindfold', module: 'm4', kind: 'lab', xp: 60, label: 'Keep secrets out of plaintext with Blindfold' },
  { id: 'm4.hpa', module: 'm4', kind: 'lab', xp: 60, label: 'Autoscale a vK8s workload for peak and idle' },
  { id: 'm4.canary', module: 'm4', kind: 'lab', xp: 60, label: 'Run a RELT-gated canary release and roll back a bad build' },
  { id: 'm4.logs', module: 'm4', kind: 'lab', xp: 60, label: 'Find the root cause of 503s in request logs' },
  { id: 'm4.storage', module: 'm4', kind: 'lab', xp: 60, label: 'Run stateful workloads on an App Stack site' },

  // Knowledge checks: 5 questions × 20 XP per module (ids generated in quizzes.js)
  ...['m1', 'm2', 'm3', 'm4'].flatMap((m) =>
    [0, 1, 2, 3, 4].map((i) => ({ id: `quiz.${m}.${i}`, module: m, kind: 'quiz', xp: 20, label: `Knowledge check ${i + 1}` })),
  ),

  // Missions
  { id: 'mission.1', module: 'missions', kind: 'mission', xp: 200, label: 'Mission 1: Zero-Trust Multi-Cloud App Delivery' },
  { id: 'mission.2', module: 'missions', kind: 'mission', xp: 200, label: 'Mission 2: Black Friday Under Siege' },
  { id: 'mission.3', module: 'missions', kind: 'mission', xp: 200, label: 'Mission 3: Edge Everywhere Rollout' },
];

export const TASK_BY_ID = Object.fromEntries(TASKS.map((t) => [t.id, t]));
export const TOTAL_XP = TASKS.reduce((s, t) => s + t.xp, 0);

export function rankFor(xp) {
  let current = RANKS[0];
  for (const r of RANKS) if (xp >= r.minXp) current = r;
  const next = RANKS.find((r) => r.minXp > xp) || null;
  return { current, next };
}

export function badgeUnlocked(badge, awarded) {
  return TASKS.filter((t) => t.module === badge.module && (t.kind === 'lab' || t.kind === 'quiz')).every((t) => awarded[t.id]);
}

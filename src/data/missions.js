// Missions are timed, multi-step scenarios. Each objective completes when the
// matching simulator event fires after the mission starts.
export const MISSIONS = [
  {
    id: 'mission.1',
    num: 1,
    title: 'Zero-Trust Multi-Cloud App Delivery',
    tagline: 'Publish a private on-prem app globally without exposing a single public IP.',
    color: '#06b6d4',
    icon: 'Lock',
    brief:
      'Acme Retail is launching its storefront. The catalog backend lives in the on-prem data center with no public IP, and security says it must stay that way. Register the data-center CE, publish the app on the F5 Anycast network and prove a customer can load it.',
    reset: ['sites', 'lb'],
    labs: ['site', 'lb'],
    objectives: [
      { event: 'site.online:onprem', label: 'Approve the On-Prem CE registration and get both tunnels green' },
      { event: 'ns.created', label: 'Create an application namespace' },
      { event: 'pool.private', label: 'Create an Origin Pool that reaches the backend privately via the On-Prem CE site' },
      { event: 'lb.internet', label: 'Advertise the HTTP Load Balancer on the RE Anycast network' },
      { event: 'traffic.ok', label: 'Send test traffic and get HTTP 200 end to end' },
    ],
    debrief:
      'The origin never received a public IP. Users hit the nearest RE through Anycast, the RE proxied over the encrypted tunnel, and the on-prem CE delivered the request on its inside network. That is zero-trust app delivery: only the published service is reachable, not the network.',
  },
  {
    id: 'mission.2',
    num: 2,
    title: 'Black Friday Under Siege',
    tagline: 'Stop four simultaneous attacks at the edge without blocking a single real shopper.',
    color: '#f43f5e',
    icon: 'Siren',
    brief:
      'It is 09:00 on Black Friday. The storefront is under a combined attack: SQL injection against search, credential stuffing on /login, an L7 flood on checkout and a scanner probing an undocumented admin API. Tune the HTTP LB security stack so every attack dies at the Regional Edge and legitimate success stays at 95% or higher.',
    reset: ['security'],
    labs: ['attack'],
    objectives: [
      { event: 'attack.blocked:sqli', label: 'Drop 100% of the OWASP SQLi at the RE' },
      { event: 'attack.blocked:bot', label: 'Drop 100% of the credential stuffing bots' },
      { event: 'attack.blocked:ddos', label: 'Mitigate the L7 DDoS spike' },
      { event: 'attack.blocked:api', label: 'Block the Shadow API probe' },
      { event: 'burst.clean', label: 'Run a full burst with zero leaks and legit success ≥ 95%' },
    ],
    debrief:
      'Each attack needed its own control. Signatures stop SQLi, but only Bot Defense stops valid-looking login attempts, rate limiting stops the flood and OAS enforcement stops shadow APIs. A blunt deny-all Service Policy would have "stopped" everything by also turning away your customers.',
  },
  {
    id: 'mission.3',
    num: 3,
    title: 'Edge Everywhere Rollout',
    tagline: 'Push a workload to every edge, stitch overlapping clouds together, and catch the slow hop.',
    color: '#a855f7',
    icon: 'Rocket',
    brief:
      'Acme wants its inventory cache running close to shoppers in every region, and the AWS checkout service must call the on-prem inventory API, even though both networks use 10.1.0.0/16. Deploy with vK8s, solve the overlap, then use RELT telemetry to find the latency regression the rollout caused and wire an alert into the SOC SIEM.',
    reset: ['appstack', 'mcn'],
    labs: ['appstack', 'mcn'],
    objectives: [
      { event: 'vk8s.multisite', label: 'Deploy inventory-cache via vK8s to 3 or more edge sites' },
      { event: 'overlap.resolved', label: 'Connect AWS Service A to on-prem Service B despite overlapping CIDRs' },
      { event: 'relt.diagnosed', label: 'Inject the fault and pinpoint the slow service from RELT metrics' },
      { event: 'siem.alert', label: 'Route a latency alert to your SIEM and receive it' },
    ],
    debrief:
      'One vK8s API placed compute on every edge, an L7 LB made overlapping IPs irrelevant, and RELT plus the Service Graph found the regression in seconds. Shipping those signals to the SIEM means the SOC sees what the platform team sees.',
  },
];

export const MISSION_CANVAS = {
  'mission.1': { id: 'mission.1', short: 'Mission 1', focus: ['ce-onprem', 're-fra', 're-ash', 'hlb', 'pool', 'svc-b', 'users'], defaultFlows: ['ns'], layers: { tun: true } },
  'mission.2': { id: 'mission.2', short: 'Mission 2', focus: ['users', 'attackers', 'policy', 're-ash', 'hlb'], defaultFlows: ['ns', 'attack'], layers: { waap: true } },
  'mission.3': { id: 'mission.3', short: 'Mission 3', focus: ['vk8s', 'ce-aws', 'ce-azure', 'ce-onprem', 're-sin', 'svc-a', 'svc-b'], defaultFlows: ['ew'], layers: { relt: true } },
};

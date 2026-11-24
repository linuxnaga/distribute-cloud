import { Boxes, Cloud, KeyRound, Network, Scale, ShieldAlert } from 'lucide-react';
import DecisionLab from './DecisionLab.jsx';

const AZURE = {
  task: 'm1.azure',
  event: 'site.online:azure-hub',
  icon: Cloud,
  crumbs: ['Multi-Cloud Network Connect', 'Site Management', 'Azure VNet Sites', 'Add Azure VNet Site'],
  nav: 'Site Management',
  ns: 'system',
  intro: 'Acme runs a hub-and-spoke network in Azure westeurope with three app spoke VNets. Deploy a CE so every spoke reaches the XC fabric and the internet through it, with no single point of failure.',
  runLabel: 'Deploy site',
  bad: 'The deployment validation failed or left spokes unreachable. Fix the flagged decisions.',
  items: [
    { id: 'vnet', title: 'Where does the CE live?', options: [['spoke', 'Inside app spoke 1'], ['hub', 'In the hub VNet (new CE subnets)'], ['new', 'A brand-new isolated VNet with no peering']], ok: (v) => v === 'hub', hint: 'In hub-and-spoke, shared network services sit in the hub so every peered spoke can use them.' },
    { id: 'type', title: 'Site type', options: [['one', 'Ingress Gateway (One Interface)'], ['two', 'Ingress/Egress Gateway (Two Interface)']], ok: (v) => v === 'two', hint: 'Spokes route through the CE, so it needs separate inside and outside interfaces.' },
    { id: 'ha', title: 'High availability', options: [['single', 'Single node'], ['aset', '3 nodes in one availability zone'], ['az', '3 nodes across availability zones 1, 2 and 3']], ok: (v) => v === 'az', hint: 'Spread the 3 nodes across zones so a zone failure leaves 2 running.' },
    { id: 'routing', title: 'How do spokes send traffic to the CE?', options: [['none', 'Leave Azure system routes as they are'], ['udr', 'Spoke route table: 0.0.0.0/0 → CE inside internal LB'], ['ars', 'Azure Route Server peering with the CE (BGP)']], ok: (v) => v === 'udr' || v === 'ars', hint: 'Without a UDR or Route Server, spokes keep using Azure\'s default internet path and bypass the CE.' },
    { id: 'nsg', title: 'NSG on the CE outside subnet', options: [['open', 'Allow all inbound from the internet'], ['out', 'Allow outbound UDP 4500 / TCP 443 to REs; no unsolicited inbound']], ok: (v) => v === 'out', hint: 'The CE dials out to the REs. It needs no open inbound ports for the tunnels.' },
  ],
  log: ['✓ Resource group acme-xc-weu created', '✓ CE outside/inside subnets in hub VNet', '✓ 3 nodes in zones 1, 2, 3 · internal LB on inside', '✓ Spoke route tables updated', '✓ IPsec → frankfurt-re-2, amsterdam-re-1 UP', '✓ acme-azure-hub ONLINE'],
  good: 'All three spokes now egress and reach other clouds through a zone-redundant CE in the hub, with nothing exposed inbound.',
};

const BGP = {
  task: 'm2.bgp',
  event: 'bgp.pass',
  icon: Network,
  crumbs: ['Multi-Cloud Network Connect', 'Networking', 'acme-dc1-vmware', 'BGP'],
  nav: 'Networking',
  ns: 'system',
  intro: 'Data-center users must reach inventory.internal at VIP 10.1.255.10 on the on-prem CE. The DC core routers (AS 65010, 10.20.0.1 and 10.20.0.2) learn routes only via BGP. Configure the CE to advertise the VIP.',
  runLabel: 'Bring up BGP sessions',
  bad: 'The sessions did not come up cleanly or advertised the wrong routes. Fix the flagged rows.',
  items: [
    { id: 'asn', title: 'CE local ASN', options: [['65010', '65010 (same as the core)'], ['64520', '64520 (unique private ASN)'], ['3356', '3356 (a public ASN)']], ok: (v) => v === '64520', hint: 'Use a unique private ASN for eBGP with the core. Reusing 65010 makes it iBGP; public ASNs are not yours to use.' },
    { id: 'peers', title: 'BGP neighbors', options: [['one', '10.20.0.1 only'], ['both', '10.20.0.1 and 10.20.0.2']], ok: (v) => v === 'both', hint: 'Peer with both core routers so losing one does not withdraw the VIP.' },
    { id: 'iface', title: 'Peering interface', options: [['outside', 'CE outside interface'], ['inside', 'CE inside interface']], ok: (v) => v === 'inside', hint: 'The core routers are on the DC inside network.' },
    { id: 'adv', title: 'What to advertise', options: [['default', '0.0.0.0/0 (default route)'], ['all', '10.1.0.0/16 (whole site range)'], ['vip', '10.1.255.10/32 (the VIP only)']], ok: (v) => v === 'vip', hint: 'Advertise only the VIP. A default or the whole /16 would pull unrelated DC traffic through the CE.' },
    { id: 'health', title: 'When every origin behind the VIP is down', options: [['keep', 'Keep advertising'], ['withdraw', 'Withdraw the /32 so routers fail over']], ok: (v) => v === 'withdraw', hint: 'Advertising a dead VIP black-holes traffic. Tie the route to origin health.' },
  ],
  log: ['BGP 64520 ↔ 65010 @ 10.20.0.1 Established', 'BGP 64520 ↔ 65010 @ 10.20.0.2 Established', 'advertised: 10.1.255.10/32 (health: up)', '✓ core-1# show ip route 10.1.255.10 → via 10.20.0.50 (CE inside), ECMP x2'],
  good: 'Both core routers learned the VIP /32 over eBGP from the inside interface, and it will be withdrawn automatically if the service has no healthy origins.',
};

const TCP = {
  task: 'm2.tcp',
  event: 'tcp.pass',
  icon: Scale,
  crumbs: ['Multi-Cloud App Connect', 'Load Balancers', 'TCP Load Balancers', 'Add TCP LB'],
  nav: 'Load Balancers',
  ns: 'acme-shop',
  intro: '20,000 warehouse IoT scanners worldwide publish to an MQTT broker in the on-prem DC over TLS on port 8883. The broker authenticates each device with its own client certificate. Publish it globally.',
  runLabel: 'Connect test devices',
  bad: 'Devices could not connect or lost their identity. Check the flagged rows.',
  items: [
    { id: 'lbtype', title: 'Load balancer type', options: [['http', 'HTTP Load Balancer'], ['tcp', 'TCP Load Balancer']], ok: (v) => v === 'tcp', hint: 'MQTT is not HTTP. An HTTP LB cannot parse it.' },
    { id: 'tls', title: 'TLS handling', options: [['term', 'Terminate TLS at the LB'], ['pass', 'TLS passthrough, route by SNI mqtt.acme.com']], ok: (v) => v === 'pass', hint: 'The broker does the client-certificate auth, so it must see the original TLS handshake.' },
    { id: 'adv', title: 'Where to advertise', options: [['site', 'Site: acme-dc1-vmware only'], ['internet', 'Internet (RE Anycast)']], ok: (v) => v === 'internet', hint: 'Devices are worldwide on the public internet; Anycast lands them on the nearest RE.' },
    { id: 'origin', title: 'Origin', options: [['public', 'Public IP of the broker'], ['site', 'mqtt-broker 10.1.6.20:8883 on site acme-dc1-vmware (inside)']], ok: (v) => v === 'site', hint: 'Keep the broker private and reach it through the on-prem CE.' },
    { id: 'protect', title: 'Which protections apply to this LB?', options: [['l7', 'App Firewall and Bot Defense'], ['l4', 'L3/L4 DDoS, IP-based service policy and connection limits']], ok: (v) => v === 'l4', hint: 'With TLS passthrough there is no visible HTTP to inspect. Protection is at L3/L4.' },
  ],
  log: ['device-0001 → Anycast 159.60.150.7:8883 (nearest: singapore-re-1)', 'SNI mqtt.acme.com → origin pool mqtt-pool via acme-dc1-vmware', 'broker: client cert CN=device-0001 verified', '✓ CONNACK 0 · 20,000 devices connected'],
  good: 'A TCP LB with SNI passthrough gives devices a global Anycast entry point while the private broker still sees and verifies each client certificate.',
};

const WAF = {
  task: 'm3.waftune',
  event: 'waftune.pass',
  icon: ShieldAlert,
  crumbs: ['Web App & API Protection', 'Security Analytics', 'shop-lb', 'Blocked Requests'],
  nav: 'App Firewall',
  ns: 'acme-shop',
  intro: 'The day after switching App Firewall to Blocking, four blocked requests have tickets attached. Decide for each: keep blocking, or add the narrowest possible exclusion. Never weaken protection more than needed.',
  runLabel: 'Apply and replay events',
  bad: 'Either legitimate users are still blocked, an attack now gets through, or an exclusion is far broader than it needs to be.',
  items: [
    { id: 'cms', title: 'POST /cms/articles · param "body" contains <p><script src="/embed.js"> · sig 200000098 XSS · user: authenticated editor', options: [['keep', 'Keep blocking'], ['narrow', 'Exclude sig 200000098 for /cms/articles, param body'], ['global', 'Exclude sig 200000098 everywhere'], ['monitor', 'Switch the WAF to Monitoring']], ok: (v) => v === 'narrow', hint: 'Editors legitimately post HTML. Exclude that one signature for that one path and parameter only.' },
    { id: 'search', title: "GET /search?q=' UNION SELECT card FROM payments-- · sig 200002835 SQLi · src: known scanner ASN", options: [['keep', 'Keep blocking'], ['narrow', 'Exclude sig 200002835 for /search, param q'], ['global', 'Exclude sig 200002835 everywhere']], ok: (v) => v === 'keep', hint: 'That is a real SQL injection attempt. The WAF did its job.' },
    { id: 'reviews', title: 'POST /api/v1/reviews · param "comment" = "Select the best size, then order 1 or 2" · sig 200002147 SQLi (low accuracy)', options: [['keep', 'Keep blocking'], ['narrow', 'Exclude sig 200002147 for /api/v1/reviews, param comment'], ['global', 'Exclude sig 200002147 everywhere'], ['monitor', 'Switch the WAF to Monitoring']], ok: (v) => v === 'narrow', hint: 'Ordinary English triggered a low-accuracy signature in a free-text field. Narrow exclusion.' },
    { id: 'docs', title: 'GET /docs?file=../../../../etc/passwd · sig 200000013 Path Traversal', options: [['keep', 'Keep blocking'], ['narrow', 'Exclude sig 200000013 for /docs, param file']], ok: (v) => v === 'keep', hint: 'Classic path traversal. Keep blocking.' },
  ],
  log: ['replay: editor article save → 200 OK (exclusion: 200000098 @ /cms/articles#body)', 'replay: review "Select the best size…" → 200 OK', 'replay: UNION SELECT probe → 403 blocked', '✓ replay: ../../etc/passwd → 403 blocked'],
  good: 'Two false positives fixed with path-and-parameter-scoped exclusions, two real attacks still blocked, and Blocking mode stays on for everything else.',
};

const BLINDFOLD = {
  task: 'm4.blindfold',
  event: 'blindfold.pass',
  icon: KeyRound,
  crumbs: ['Distributed Apps', 'Virtual K8s', 'inventory-cache', 'Secrets'],
  nav: 'Virtual K8s',
  ns: 'acme-shop',
  intro: 'inventory-cache now needs a database password, and its HTTP LB needs a custom TLS certificate with a private key. Security requires that no plaintext secret is ever stored in the console, in Git, or readable by F5.',
  runLabel: 'Deploy with secrets',
  bad: 'A plaintext secret ended up somewhere it should not be, or the policy is too broad. Check the flagged rows.',
  items: [
    { id: 'db', title: 'Database password for the vK8s workload', options: [['env', 'Plain env var in the Deployment YAML'], ['k8s', 'Kubernetes Secret (base64) in vK8s'], ['blind', 'Blindfold-encrypted secret, decrypted only on the site']], ok: (v) => v === 'blind', hint: 'base64 is encoding, not encryption. Blindfold encrypts the secret before it ever leaves your laptop.' },
    { id: 'policy', title: 'Secret policy: who may decrypt it?', options: [['tenant', 'Any site in the tenant'], ['vsite', 'Only sites in virtual site acme-shop/edge-vsite']], ok: (v) => v === 'vsite', hint: 'Limit decryption to the sites that actually run the workload.' },
    { id: 'key', title: 'Custom TLS private key for shop-lb', options: [['clear', 'Paste the PEM into the console as clear text'], ['blind', 'Blindfold the key with vesctl, then upload the ciphertext']], ok: (v) => v === 'blind', hint: 'Clear-text keys are stored by the control plane. Blindfold the key first.' },
    { id: 'f5', title: 'After this, can an F5 operator read the secrets?', options: [['yes', 'Yes, F5 holds the decryption key'], ['no', 'No: only the policy-approved sites can unseal them at runtime']], ok: (v) => v === 'no', hint: 'Blindfold keeps the unsealing at the edge. The SaaS control plane only ever stores ciphertext.' },
  ],
  log: ['$ vesctl request secret encrypt --policy-document edge-vsite-policy db-pass.txt', '→ string:///AAAAE2FjbWUtc2hvcC1lZGdl…  (ciphertext only)', 'Deployment env DB_PASSWORD: blindfold://… → unsealed by Secret Management Agent on 3 sites', '✓ shop-lb TLS key: blindfolded · console stores ciphertext only'],
  good: 'The password and private key exist in plaintext only inside the approved edge sites at runtime. The console, Git and F5 only ever see ciphertext.',
};

const HPA = {
  task: 'm4.hpa',
  event: 'hpa.pass',
  icon: Boxes,
  crumbs: ['Distributed Apps', 'Virtual K8s', 'inventory-cache', 'Horizontal Pod Autoscaler'],
  nav: 'Virtual K8s',
  ns: 'acme-shop',
  intro: 'inventory-cache peaks at 1,600 rps on its busiest site during Black Friday and idles near 300 rps. One pod handles about 250 rps at 70% CPU. Configure autoscaling per site so it stays fast at peak and cheap at night.',
  runLabel: 'Replay 24h of Black Friday',
  bad: 'The replay showed slow responses, wasted capacity, or replica flapping. Check the flagged rows.',
  items: [
    { id: 'req', title: 'Container CPU requests', options: [['none', 'Not set'], ['250m', '250m CPU request per container']], ok: (v) => v === '250m', hint: 'A CPU-percentage HPA computes utilization against requests. Without them it cannot scale.' },
    { id: 'min', title: 'Minimum replicas per site', options: [['1', '1'], ['2', '2'], ['8', '8']], ok: (v) => v === '2', hint: 'Keep 2 for availability during a pod restart; 8 at idle wastes money.' },
    { id: 'max', title: 'Maximum replicas per site', options: [['4', '4'], ['8', '8'], ['50', '50']], ok: (v) => v === '8', hint: '1,600 rps ÷ 250 rps per pod ≈ 7 pods. 8 covers the peak with headroom; 4 is too few, 50 is runaway cost.' },
    { id: 'target', title: 'Target CPU utilization', options: [['30', '30%'], ['70', '70%'], ['95', '95%']], ok: (v) => v === '70', hint: '70% matches the per-pod sizing and leaves room for bursts. 95% scales too late; 30% overprovisions.' },
    { id: 'down', title: 'Scale-down stabilization window', options: [['0', '0 seconds'], ['300', '300 seconds']], ok: (v) => v === '300', hint: 'Without a window, replicas flap up and down on every traffic wobble.' },
  ],
  log: ['02:00 300 rps → 2 replicas', '09:00 sale opens 1,600 rps → scaled to 7 replicas in 90s · p95 31ms', '13:00 brief dip → held at 7 (stabilization)', '✓ 23:00 back to 2 replicas · 0 SLO breaches'],
  good: 'The autoscaler follows demand on every edge: 2 pods at night, 7 at the peak, no flapping and no runaway spend.',
};

export const AzureSiteLab = () => <DecisionLab spec={AZURE} />;
export const BgpLab = () => <DecisionLab spec={BGP} />;
export const TcpLbLab = () => <DecisionLab spec={TCP} />;
export const WafTuningLab = () => <DecisionLab spec={WAF} />;
export const BlindfoldLab = () => <DecisionLab spec={BLINDFOLD} />;
export const AutoscaleLab = () => <DecisionLab spec={HPA} />;

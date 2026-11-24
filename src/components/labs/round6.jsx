import { Database, EyeOff, GitBranch, HeartPulse, Route, Tags } from 'lucide-react';
import DecisionLab from './DecisionLab.jsx';

const VSITE = {
  task: 'm1.vsite',
  event: 'vsite.pass',
  icon: Tags,
  crumbs: ['Multi-Cloud Network Connect', 'Virtual Sites', 'Add Virtual Site'],
  nav: 'Site Management',
  ns: 'shared',
  intro:
    'Sites carry labels: acme-aws-use1 {env=prod, cloud=aws, geo=us}, acme-azure-weu {env=prod, cloud=azure, geo=eu}, acme-gcp-sin {env=prod, cloud=gcp, geo=apac}, acme-dc1-vmware {env=prod, cloud=onprem, geo=eu}, acme-staging-ce {env=staging, cloud=aws, geo=us}. Build label selectors for three virtual sites.',
  runLabel: 'Evaluate selectors',
  bad: 'At least one virtual site matches the wrong set of sites.',
  items: [
    { id: 'eu', title: 'eu-edge: every production site in Europe', options: [['a', 'geo in (eu)'], ['b', 'env == prod AND geo in (eu)'], ['c', 'cloud in (azure)']], ok: (v) => v === 'b', hint: '"geo in (eu)" alone works today, but without env==prod a future EU staging site would join. "cloud in (azure)" misses the on-prem DC.' },
    { id: 'cloud', title: 'public-cloud-prod: production sites in any public cloud', options: [['a', 'env == prod AND cloud != onprem'], ['b', 'cloud in (aws, azure, gcp)'], ['c', 'env == prod']], ok: (v) => v === 'a', hint: 'Option b also matches acme-staging-ce; option c includes the on-prem DC.' },
    { id: 'canary', title: 'canary: only the staging CE', options: [['a', 'env == staging'], ['b', 'cloud == aws'], ['c', 'geo == us']], ok: (v) => v === 'a', hint: 'cloud==aws and geo==us both also match acme-aws-use1, a production site.' },
    { id: 'why', title: 'Why use virtual sites instead of listing sites by name?', options: [['a', 'Names are not allowed in selectors'], ['b', 'New sites with matching labels join automatically, with no config change']], ok: (v) => v === 'b', hint: 'Label-driven membership is what makes fleet-wide deployments scale.' },
  ],
  log: ['eu-edge → acme-azure-weu, acme-dc1-vmware', 'public-cloud-prod → acme-aws-use1, acme-azure-weu, acme-gcp-sin', 'canary → acme-staging-ce', '✓ 3 virtual sites saved in namespace shared'],
  good: 'Each selector matches exactly the intended sites, and any new site labelled the same way joins automatically.',
};

const ROUTES = {
  task: 'm2.routes',
  event: 'routes.pass',
  icon: Route,
  crumbs: ['Multi-Cloud App Connect', 'Load Balancers', 'shop-lb', 'Routes'],
  nav: 'Load Balancers',
  ns: 'acme-shop',
  intro: 'shop.acme.com now fronts several backends. Configure routes on the HTTP LB. Routes are evaluated top to bottom and the first match wins; anything unmatched goes to the default pool (storefront-pool).',
  runLabel: 'Send test requests',
  bad: 'Some requests landed on the wrong backend or got the wrong response.',
  items: [
    { id: 'api', title: 'Requests to /api/*', options: [['default', 'Default pool'], ['api', 'Route: path prefix /api/ → api-pool'], ['redirect', 'Redirect to api.acme.com']], ok: (v) => v === 'api', hint: 'The API runs on its own pool, and mobile apps cannot follow a cross-host redirect for POSTs reliably.' },
    { id: 'mobile', title: 'Requests with header X-App-Version: 1.x (old mobile app)', options: [['none', 'No special route'], ['legacy', 'Route: header X-App-Version regex ^1\\. → api-legacy-pool, placed above /api/']], ok: (v) => v === 'legacy', hint: 'Old app versions need the legacy API, and the header route must sit above the generic /api/ route or it never matches.' },
    { id: 'http', title: 'Plain http:// requests', options: [['serve', 'Serve them'], ['redir', 'HTTP → HTTPS redirect (301)']], ok: (v) => v === 'redir', hint: 'Always redirect cleartext HTTP to HTTPS.' },
    { id: 'old', title: '/promo-2025/* (retired campaign pages)', options: [['404', 'Let the backend return 404'], ['redir', 'Direct response: 301 to /deals']], ok: (v) => v === 'redir', hint: 'Old links from emails and search engines should land somewhere useful.' },
    { id: 'rewrite', title: 'api-pool expects paths without the /api prefix', options: [['none', 'No change'], ['rewrite', 'Prefix rewrite /api/ → / on the /api/ route']], ok: (v) => v === 'rewrite', hint: 'Without a prefix rewrite the backend receives /api/v1/cart and returns 404.' },
  ],
  log: ['GET http://shop.acme.com/ → 301 https://shop.acme.com/', 'GET /api/v1/cart (X-App-Version: 1.9) → api-legacy-pool', 'GET /api/v1/cart → api-pool as /v1/cart', 'GET /promo-2025/socks → 301 /deals', '✓ GET /catalog → storefront-pool'],
  good: 'Every request type reaches the right backend: header routes before path routes, prefix rewrite for the API, and redirects for HTTP and retired URLs.',
};

const HEALTH = {
  task: 'm2.health',
  event: 'health.pass',
  icon: HeartPulse,
  crumbs: ['Multi-Cloud App Connect', 'Origin Pools', 'catalog-pool', 'Health & Endpoint Selection'],
  nav: 'Origin Pools',
  ns: 'acme-shop',
  intro: 'catalog-pool has origins in AWS (us-east) and the on-prem DC. Last week a hung JVM kept answering TCP but returned 500s for 20 minutes, and EU users were sent to the US origins for no reason. Fix the pool.',
  runLabel: 'Replay last week\'s incident',
  bad: 'The replay still sent users to broken or distant origins.',
  items: [
    { id: 'hc', title: 'Health check', options: [['tcp', 'TCP connect on port 8080'], ['http', 'HTTP GET /healthz, expect 200'], ['none', 'No health check']], ok: (v) => v === 'http', hint: 'A hung JVM still accepts TCP connections. Only an HTTP check sees the 500s.' },
    { id: 'thr', title: 'Interval and thresholds', options: [['slow', 'Every 60s, unhealthy after 5 failures'], ['fast', 'Every 5s, unhealthy after 2 failures, healthy after 3 passes']], ok: (v) => v === 'fast', hint: 'Detection takes interval × threshold: 5 minutes is far too slow for a storefront.' },
    { id: 'algo', title: 'Load balancing algorithm', options: [['rr', 'Round robin'], ['lc', 'Least active requests'], ['hash', 'Ring hash on client IP']], ok: (v) => v === 'lc' || v === 'rr', hint: 'Ring hash pins users to an origin and fights failover; it is for cache affinity, not this pool.' },
    { id: 'sel', title: 'Endpoint selection', options: [['dist', 'Distributed: any healthy origin anywhere'], ['local', 'Local preferred: origins near the receiving site first, others on failure']], ok: (v) => v === 'local', hint: 'Local preferred keeps EU users on EU origins and only crosses the ocean when local origins fail.' },
  ],
  log: ['14:02 dc1-catalog-2 /healthz → 500 (1/2)', '14:02 dc1-catalog-2 /healthz → 500 (2/2) → UNHEALTHY, removed', 'EU users → dc1-catalog-1 (local), US users → aws-catalog-1/2', '✓ 0 user-facing 500s, failover in 10s'],
  good: 'An HTTP health check pulls a sick origin in about 10 seconds, and local-preferred selection keeps users on nearby origins unless those fail.',
};

const DATAGUARD = {
  task: 'm3.dataguard',
  event: 'dataguard.pass',
  icon: EyeOff,
  crumbs: ['Web App & API Protection', 'Load Balancers', 'shop-lb', 'Data Guard & Sensitive Data'],
  nav: 'API Security',
  ns: 'acme-shop',
  intro: 'A pen test found /account/orders responses contain full card numbers and the legacy /support/export page shows customers\' national ID numbers. Fixing the app will take a quarter. Contain it at the edge today.',
  runLabel: 'Replay pen-test requests',
  bad: 'Sensitive data still leaves in responses, or legitimate flows broke.',
  items: [
    { id: 'dg', title: 'Data Guard on shop-lb', options: [['off', 'Off'], ['all', 'On for all paths'], ['scoped', 'On, applied to /account/* and /support/*']], ok: (v) => v === 'scoped' || v === 'all', hint: 'Data Guard masks credit card and national ID patterns in responses at the edge.' },
    { id: 'skip', title: 'Payment provider callback /payments/callback must receive the real card token format', options: [['mask', 'Mask it too'], ['skip', 'Exclude /payments/callback from Data Guard']], ok: (v) => v === 'skip', hint: 'Masking the payment provider\'s callback breaks checkout. Exclude that one path.' },
    { id: 'disc', title: 'Find other endpoints leaking PII', options: [['manual', 'Ask each team to self-report'], ['disc', 'Enable API Discovery sensitive-data detection and review flagged endpoints']], ok: (v) => v === 'disc', hint: 'Discovery classifies responses (cards, emails, IDs) from live traffic, so you find leaks nobody reported.' },
    { id: 'fix', title: 'Long-term', options: [['done', 'Data Guard is enough, close the finding'], ['both', 'Keep Data Guard as a compensating control and fix the app']], ok: (v) => v === 'both', hint: 'Edge masking is a compensating control. The app should not send that data in the first place.' },
  ],
  log: ['GET /account/orders → "card": "************4242"', 'GET /support/export → "national_id": "*******123"', 'POST /payments/callback → passed unmodified (excluded)', '✓ Discovery flagged 2 more endpoints with email addresses'],
  good: 'Card and ID numbers are masked at the edge today, payments keep working, discovery found two more leaks, and the app fix stays on the roadmap.',
};

const THREATINTEL = {
  task: 'm3.threatintel',
  event: 'threatintel.pass',
  icon: Database,
  crumbs: ['Web App & API Protection', 'Load Balancers', 'shop-lb', 'IP Reputation & Trusted Clients'],
  nav: 'Service Policies',
  ns: 'acme-shop',
  intro: 'Two problems: botnets and scanners from known-bad IPs keep probing the shop, and the company\'s own uptime monitor and pen-test vendor keep getting blocked by the WAF. Configure IP reputation and trusted clients carefully.',
  runLabel: 'Replay a day of traffic',
  bad: 'Known-bad IPs still reach the app, or a trusted-client rule is far too broad.',
  items: [
    { id: 'rep', title: 'IP reputation', options: [['off', 'Off'], ['cats', 'Block categories: Botnets, Scanners, Spam Sources, Windows Exploits, TOR proxies'], ['all', 'Block every category including Mobile Threats and Proxy']], ok: (v) => v === 'cats', hint: 'Blocking every category catches shared mobile carrier NAT and corporate proxies, which carry real shoppers.' },
    { id: 'mon', title: 'Uptime monitor (198.51.100.20/32) gets blocked by Bot Defense', options: [['skip-all', 'Trusted client: skip all security processing for 0.0.0.0/0'], ['skip-bot', 'Trusted client 198.51.100.20/32: skip Bot Defense only']], ok: (v) => v === 'skip-bot', hint: 'Scope trusted clients to the exact IP and only the check that blocks it.' },
    { id: 'pt', title: 'Pen-test vendor (203.0.113.64/28) this week', options: [['perm', 'Permanent trusted client, skip WAF'], ['exp', 'Trusted client, skip WAF, expires Friday 18:00']], ok: (v) => v === 'exp', hint: 'Exceptions for testing must expire on their own, or they become permanent holes.' },
    { id: 'order', title: 'Where do trusted clients sit relative to IP reputation?', options: [['after', 'After: reputation can still block them'], ['before', 'Before: they are evaluated first and bypass the listed checks']], ok: (v) => v === 'before', hint: 'Trusted clients are evaluated first, which is exactly why they must be narrow.' },
  ],
  log: ['botnet 45.95.x.x → 403 ip_reputation:BOTNETS', 'mobile shopper via carrier NAT → 200', 'uptime monitor 198.51.100.20 → 200 (bot defense skipped)', '✓ pen-test 203.0.113.70 → WAF skipped (expires Fri 18:00)'],
  good: 'Known-bad sources are dropped by reputation, real shoppers behind shared IPs are not, and both exceptions are scoped to the exact IPs, checks and time window.',
};

const CANARY = {
  task: 'm4.canary',
  event: 'canary.pass',
  icon: GitBranch,
  crumbs: ['Distributed Apps', 'Load Balancers', 'shop-lb', 'Canary Release'],
  nav: 'Service Graph',
  ns: 'acme-shop',
  intro: 'checkout v2 is deployed alongside v1 as a separate origin pool. Release it safely: send a small share of real traffic, watch RELT, and promote or roll back.',
  runLabel: 'Run the release',
  bad: 'The release either exposed too many users to risk or promoted a bad build.',
  items: [
    { id: 'w', title: 'Initial weights on the /checkout route', options: [['50', 'v1 50 / v2 50'], ['5', 'v1 95 / v2 5'], ['100', 'v1 0 / v2 100']], ok: (v) => v === '5', hint: 'Start small: 5% limits the blast radius while still producing real signal.' },
    { id: 'staff', title: 'Before any customer traffic', options: [['none', 'Nothing'], ['hdr', 'Header route x-canary: true → v2, used by staff for an hour']], ok: (v) => v === 'hdr', hint: 'Dogfood with a header route first; no customer sees v2 until staff have.' },
    { id: 'gate', title: 'Promotion gate (compare v2 against v1)', options: [['time', 'Promote after 1 hour regardless'], ['relt', 'Promote only if v2 error rate and p95 latency are within 10% of v1']], ok: (v) => v === 'relt', hint: 'Time alone proves nothing. Gate on RELT comparisons.' },
    { id: 'obs', title: 'At 5%, v2 shows 3.1% errors vs 0.2% on v1', options: [['wait', 'Wait and see'], ['up', 'Increase to 25% for more data'], ['back', 'Roll back: set v2 weight to 0']], ok: (v) => v === 'back', hint: 'That is a 15× error rate. Shift the weight back to v1 immediately; it takes effect on every RE at once.' },
  ],
  log: ['10:00 staff header route → v2 OK', '11:00 weights 95/5', '11:20 v2 errors 3.1% vs 0.2% → gate FAILED', '✓ 11:21 v2 weight 0 · customers on v1 · 0.25% of sessions affected'],
  good: 'Weighted routes plus a RELT gate turned a bad build into a 20-minute blip for 5% of users instead of an outage, and rollback was one weight change.',
};

export const VirtualSiteLab = () => <DecisionLab spec={VSITE} />;
export const RoutesLab = () => <DecisionLab spec={ROUTES} />;
export const HealthLab = () => <DecisionLab spec={HEALTH} />;
export const DataGuardLab = () => <DecisionLab spec={DATAGUARD} />;
export const ThreatIntelLab = () => <DecisionLab spec={THREATINTEL} />;
export const CanaryLab = () => <DecisionLab spec={CANARY} />;

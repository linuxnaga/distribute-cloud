import { Bot, FileSearch, HardDrive, KeySquare, Network, ShieldQuestion } from 'lucide-react';
import DecisionLab from './DecisionLab.jsx';

const API = {
  task: 'm1.api',
  event: 'api.pass',
  icon: KeySquare,
  crumbs: ['Administration', 'Credentials', 'API Credentials & Service Credentials'],
  nav: 'Site Management',
  ns: 'system',
  intro: 'The platform team wants to manage all XC config from Terraform in a CI pipeline, and a developer wants to script vesctl from their laptop. Set up credentials without creating a long-lived master key.',
  runLabel: 'Run pipeline and audit',
  bad: 'The audit flagged an over-privileged, shared or never-expiring credential.',
  items: [
    { id: 'ci', title: 'Credential for the Terraform CI pipeline', options: [['user', 'An API token created from a person\'s own account'], ['svc', 'A service credential with its own role and namespaces']], ok: (v) => v === 'svc', hint: 'CI should not act as a person. Service credentials have their own identity, roles and audit trail and survive people leaving.' },
    { id: 'role', title: 'Role for that service credential', options: [['admin', 'Tenant admin on all namespaces'], ['scoped', 'Only the roles needed in system, shared and acme-shop']], ok: (v) => v === 'scoped', hint: 'Least privilege applies to machines too.' },
    { id: 'type', title: 'Credential type for vesctl on a laptop', options: [['token', 'API token pasted into a shell script in Git'], ['cert', 'API certificate (p12) stored in the OS keychain']], ok: (v) => v === 'cert', hint: 'Never commit tokens to Git. A certificate in the keychain is the vesctl-native way.' },
    { id: 'exp', title: 'Expiry', options: [['never', 'Longest possible, to avoid breakage'], ['90', '90 days, with rotation automated in the pipeline']], ok: (v) => v === '90', hint: 'Short-lived, auto-rotated credentials limit the damage from a leak.' },
    { id: 'store', title: 'Where the pipeline keeps the secret', options: [['repo', 'terraform.tfvars in the repo'], ['vault', 'CI secret store, injected as an environment variable at run time']], ok: (v) => v === 'vault', hint: 'Secrets live in the CI secret store, never in the repository.' },
  ],
  log: ['terraform plan → 14 resources, authenticated as svc-terraform-ci', 'audit: svc-terraform-ci roles = [ns-admin@acme-shop, monitor@system, shared-editor]', 'audit: no credentials without expiry', '✓ rotation job scheduled every 60 days'],
  good: 'Automation runs as its own scoped, expiring identity; people use certificates kept out of Git, and every change is attributable in the audit log.',
};

const TGW = {
  task: 'm2.tgw',
  event: 'tgw.pass',
  icon: Network,
  crumbs: ['Multi-Cloud Network Connect', 'Site Management', 'AWS TGW Sites', 'Add AWS TGW Site'],
  nav: 'Site Management',
  ns: 'system',
  intro: 'Acme has 12 application VPCs in us-east-1. Instead of putting a CE in each, deploy one AWS Transit Gateway site so all of them reach the XC fabric, with east-west inspection between VPCs.',
  runLabel: 'Deploy TGW site',
  bad: 'Some VPCs are unreachable or traffic bypasses the CE. Check the flagged rows.',
  items: [
    { id: 'tgw', title: 'Transit Gateway', options: [['new', 'Let XC create a new TGW for the site'], ['none', 'Skip TGW; peer every VPC to every other VPC']], ok: (v) => v === 'new' , hint: '12 VPCs fully peered is 66 peerings. A TGW site is the hub instead.' },
    { id: 'attach', title: 'Spoke VPC attachment', options: [['manual', 'Attach a couple now, the rest later by hand'], ['all', 'Attach all 12 spoke VPCs in the site config']], ok: (v) => v === 'all', hint: 'The site config manages attachments and route tables, so attach every spoke there.' },
    { id: 'ew', title: 'VPC-to-VPC traffic', options: [['direct', 'Route directly between VPCs on the TGW'], ['ce', 'Steer through the CE services VPC for firewall inspection']], ok: (v) => v === 'ce', hint: 'The point was east-west inspection, so VPC-to-VPC must route via the CE.' },
    { id: 'ha', title: 'CE nodes in the services VPC', options: [['1', '1 node'], ['3', '3 nodes across 3 AZs']], ok: (v) => v === '3', hint: 'All 12 VPCs now depend on it: make it zone-redundant.' },
    { id: 'cidr', title: 'Spoke VPC CIDRs', options: [['overlap', 'Several reuse 10.0.0.0/16'], ['unique', 'Unique per VPC (or use L7 LBs for any overlap)']], ok: (v) => v === 'unique', hint: 'TGW routing is L3: overlapping spokes cannot be routed. Re-IP or publish those apps via LBs.' },
  ],
  log: ['TGW tgw-0a1b created, 12 VPC attachments', 'spoke route tables: 0.0.0.0/0 → TGW → CE services VPC', '3 CE nodes up in us-east-1a/b/c', '✓ vpc-payments → vpc-orders: allowed by network firewall, logged'],
  good: 'One TGW site gives all 12 VPCs fabric connectivity and inspected east-west traffic, instead of 12 CEs or 66 peerings.',
};

const CAMPAIGNS = {
  task: 'm3.campaigns',
  event: 'campaigns.pass',
  icon: ShieldQuestion,
  crumbs: ['Web App & API Protection', 'App Firewalls', 'shop-waf', 'Signatures & Threat Campaigns'],
  nav: 'App Firewall',
  ns: 'shared',
  intro: 'F5 updates attack signatures and threat campaigns continuously. Configure shop-waf so new protections arrive fast without surprise false positives, and decide how to react to an active campaign.',
  runLabel: 'Simulate a signature update + campaign',
  bad: 'You either broke the site with an untested update or missed an active campaign.',
  items: [
    { id: 'acc', title: 'Signature accuracy to enforce', options: [['high', 'High only'], ['hm', 'High and medium'], ['all', 'High, medium and low']], ok: (v) => v === 'hm', hint: 'High+medium is the usual balance. Low-accuracy signatures cause most false positives.' },
    { id: 'staging', title: 'Newly released signatures', options: [['block', 'Enforce in blocking immediately'], ['stage', 'Staging: log-only for 7 days, then auto-enforce if no false positives']], ok: (v) => v === 'stage', hint: 'Signature staging lets you see what new signatures would block before they actually do.' },
    { id: 'tc', title: 'Threat campaigns', options: [['off', 'Disabled'], ['on', 'Enabled (blocking)']], ok: (v) => v === 'on', hint: 'Threat campaigns match specific in-the-wild exploit kits with near-zero false positives. Block them.' },
    { id: 'cve', title: 'A campaign for a new Spring4Shell-style RCE is hitting your LBs', options: [['wait', 'Wait for the app team to patch'], ['ok', 'Confirm it is blocked by the campaign rule, then still patch the app']], ok: (v) => v === 'ok', hint: 'The WAF buys time, it is not the fix. Verify the block and patch.' },
  ],
  log: ['sig update 2026-11-24: 38 new signatures → staging (log only)', 'staging report: 0 would-block on legit traffic → enforced 12/01', 'threat campaign TC-2026-1187 matched 2,410 requests → blocked', '✓ app team patch deployed 2 days later'],
  good: 'New signatures prove themselves in staging, active exploit campaigns are blocked on day zero, and the WAF buys time for the real fix.',
};

const BOT = {
  task: 'm3.botadv',
  event: 'botadv.pass',
  icon: Bot,
  crumbs: ['Web App & API Protection', 'Bot Defense', 'shop-lb', 'Protected Endpoints'],
  nav: 'Bot Defense',
  ns: 'acme-shop',
  intro: 'Bot Defense is on, but only for POST /login. Fraud now hits gift-card balance checks, account sign-up and the mobile app. Configure protected endpoints and actions for each.',
  runLabel: 'Replay a week of bot traffic',
  bad: 'Bots still get through somewhere, or real customers are being blocked.',
  items: [
    { id: 'gift', title: 'POST /giftcard/balance (card-cracking bots)', options: [['none', 'Not protected'], ['block', 'Protected · mitigation: Block']], ok: (v) => v === 'block', hint: 'Gift-card cracking is pure automation. Protect and block.' },
    { id: 'signup', title: 'POST /account/signup (fake accounts)', options: [['block', 'Protected · Block'], ['flag', 'Protected · Flag (add header, let the app hold the account for review)']], ok: (v) => v === 'flag' || v === 'block', hint: 'Either works. Flagging lets fraud ops review borderline cases.' },
    { id: 'mobile', title: 'Native mobile app calls POST /api/v1/login', options: [['web', 'Same web JS protection'], ['sdk', 'Integrate the Bot Defense mobile SDK and protect the endpoint for mobile clients']], ok: (v) => v === 'sdk', hint: 'Native apps do not run the browser JS. They need the mobile SDK to produce telemetry.' },
    { id: 'partner', title: 'A price-comparison partner scrapes /catalog with permission', options: [['block', 'Block it with everyone else'], ['allow', 'Add it as a known good bot / trusted client for /catalog']], ok: (v) => v === 'allow', hint: 'Good bots you have agreed to should be allowed explicitly.' },
    { id: 'js', title: 'JS injection placement', options: [['none', 'Manual: ask web team to add the tag'], ['auto', 'Auto-insert JS on pages that lead to protected endpoints']], ok: (v) => v === 'auto', hint: 'Let the LB inject the telemetry JS on the pages that submit to protected endpoints.' },
  ],
  log: ['giftcard/balance: 1.2M automated attempts blocked', 'signup: 8,400 flagged, held for review', 'mobile login via SDK: 96k bot attempts blocked, 0 app-store complaints', '✓ partner scraper: allowed on /catalog'],
  good: 'Every abused endpoint is now protected with the right action, the mobile app has native telemetry, and the agreed partner keeps working.',
};

const LOGS = {
  task: 'm4.logs',
  event: 'logs.pass',
  icon: FileSearch,
  crumbs: ['Observability', 'Requests', 'shop-lb', 'Request Log Explorer'],
  nav: 'Log Receivers',
  ns: 'acme-shop',
  intro: 'Since 09:40, about 2% of checkout requests fail with HTTP 503. The dashboard shows it, but not why. Build the request-log query that finds the cause.',
  runLabel: 'Run query',
  bad: 'The query returns too much noise or the wrong evidence. Refine it.',
  items: [
    { id: 'filter', title: 'Filter', options: [['all', 'All requests, last 24h'], ['5xx', 'rsp_code = 503 AND req_path starts with /checkout, since 09:30']], ok: (v) => v === '5xx', hint: 'Narrow to the failing code, path and time window.' },
    { id: 'group', title: 'Group by', options: [['country', 'src country'], ['dst', 'dst_site and dst_instance (origin that handled it)'], ['ua', 'user agent']], ok: (v) => v === 'dst', hint: 'A 503 means the upstream failed. Group by which origin served it.' },
    { id: 'flag', title: 'Response flag to look for', options: [['UF', 'UF: upstream connection failure'], ['RL', 'RL: rate limited'], ['DC', 'DC: downstream connection terminated']], ok: (v) => v === 'UF', hint: 'UF says the LB could not connect to the origin.' },
    { id: 'concl', title: 'Result: 100% of 503s are from dc1-checkout-3, flag UF. Conclusion?', options: [['app', 'A bug in the new checkout code'], ['origin', 'One origin instance is refusing connections; remove it and fix its health check']], ok: (v) => v === 'origin', hint: 'One instance, connection failures: an instance problem, and the health check missed it.' },
  ],
  log: ['rsp_code=503 path=/checkout* since 09:30 → 1,184 rows', 'group by dst_instance → dc1-checkout-3: 1,184 (100%)', 'rsp_code_details: upstream connect error · flags: UF', '✓ dc1-checkout-3 drained; health check changed TCP → HTTP /healthz'],
  good: 'Three filters turned "2% errors" into one broken origin instance and a health-check fix, in minutes instead of a war room.',
};

const STORAGE = {
  task: 'm4.storage',
  event: 'storage.pass',
  icon: HardDrive,
  crumbs: ['Distributed Apps', 'App Stack Sites', 'acme-dc1-appstack', 'Storage & Stateful Workloads'],
  nav: 'Virtual K8s',
  ns: 'acme-shop',
  intro: 'The retail team wants a small Redis cache and a PostgreSQL replica running on the store-edge App Stack site, so stores keep working when the WAN is down. Configure storage for stateful workloads.',
  runLabel: 'Deploy and pull the WAN cable',
  bad: 'Data was lost on a pod restart, or the workload could not schedule.',
  items: [
    { id: 'sc', title: 'App Stack site storage', options: [['none', 'No storage class configured'], ['sc', 'Configure a storage class on the site (local disks or the store NAS via CSI)']], ok: (v) => v === 'sc', hint: 'Persistent volumes need a storage class on the App Stack site.' },
    { id: 'kind', title: 'PostgreSQL workload type', options: [['deploy', 'Deployment with emptyDir'], ['sts', 'StatefulSet with a PersistentVolumeClaim per replica']], ok: (v) => v === 'sts', hint: 'emptyDir disappears with the pod. Databases need StatefulSets with PVCs.' },
    { id: 'redis', title: 'Redis cache (rebuildable from the DB)', options: [['pvc', 'StatefulSet with PVC'], ['ephemeral', 'Deployment, ephemeral storage is fine']], ok: (v) => v === 'ephemeral' || v === 'pvc', hint: 'A rebuildable cache can be ephemeral, though persisting it is not wrong.' },
    { id: 'placement', title: 'Where it runs', options: [['vsite', 'Virtual site of all edges'], ['site', 'Only the store\'s own App Stack site (site-local)']], ok: (v) => v === 'site', hint: 'This data is local to each store. Pin it to that store\'s site.' },
    { id: 'backup', title: 'Backups', options: [['none', 'Not needed, it is a replica'], ['yes', 'Scheduled PVC snapshots plus WAL shipping to the central DB when the WAN is up']], ok: (v) => v === 'yes', hint: 'Edge data written during WAN outages exists nowhere else until it syncs.' },
  ],
  log: ['storageclass store-nas (csi) ready', 'statefulset/pg-replica 1/1, pvc 50Gi bound', 'WAN down 14:00–14:45: POS kept writing locally', '✓ WAN up: 2,310 WAL segments shipped, snapshot 14:50'],
  good: 'Stateful edge workloads survive pod restarts and WAN outages, stay pinned to their store, and sync back safely.',
};

export const ApiCredsLab = () => <DecisionLab spec={API} />;
export const TgwLab = () => <DecisionLab spec={TGW} />;
export const CampaignsLab = () => <DecisionLab spec={CAMPAIGNS} />;
export const BotAdvLab = () => <DecisionLab spec={BOT} />;
export const LogsLab = () => <DecisionLab spec={LOGS} />;
export const StorageLab = () => <DecisionLab spec={STORAGE} />;

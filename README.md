# XC Flow Academy · F5 Distributed Cloud Learning Simulator

A single-page, gamified learning app for **F5 Distributed Cloud Services (F5 XC)**. Learners explore an interactive multi-cloud architecture diagram, run hands-on labs in a simulated XC Console, earn XP and badges, and play three end-to-end missions.

Built with **React 19**, **Tailwind CSS v4** and **Lucide** icons on **Vite**. No backend: progress is saved in the browser's `localStorage`.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # static site in dist/
npm run preview   # serve the production build
```

The build uses relative asset paths, so `dist/` can be hosted on any static host (GitHub Pages, S3, an F5 XC origin, etc.).

## What's inside

**Player progression (HUD)**
- CloudOps rank: Lvl 1 Edge Explorer → Lvl 2 Tunnel Technician → Lvl 3 Mesh Weaver → Lvl 4 Edge Sentinel → Lvl 5 Distributed Cloud Architect
- XP bar to the next rank, overall mastery score, and four badges: Global Mesh & RE/CE Tunnels, MCN, WAAP & Bot Defense, App Stack Edge Orchestration
- Every XP award is keyed to a task, so repeating an action never double-counts

**Skill tree: four modules**
1. Platform Architecture & Core Components: SaaS control plane, REs, CEs, sites, namespaces, auto IPsec/SSL tunnels
2. Multi-Cloud Networking & Distributed LB: origin pools on CE sites, Anycast HTTP LBs, overlapping IPs, N-S vs E-W, Site Mesh Groups vs DC Cluster Groups
3. WAAP, DDoS & Bot Defense: App Firewall (monitor vs block), Bot Defense, L7 DDoS, API Discovery/OAS, Service Policies
4. App Stack & Observability: vK8s on virtual sites, RELT metrics, Service Graph, alert policies and SIEM log receivers

Each module has key concepts, an objectives checklist, a split-screen workbench and a five-question knowledge check.

**Interactive flow canvas (SVG)**
- End users and attackers → Anycast REs on the global backbone → IPsec/SSL tunnels → CEs in AWS, Azure and on-prem, overseen by the SaaS control plane
- Animated North-South, East-West and attack packets that react to the lab state (unregistered sites cut the path, WAAP config decides whether attacks die at the RE, a Site Mesh Group reroutes E-W traffic)
- Toggleable layers: Control Plane, Data Plane, Tunnel Status, WAAP Enforcement, RELT Telemetry
- Click any component to open an inspector card with its role, routing behavior and live metrics

**Simulated XC Console labs**
- Site & Tunnel Registration: accept CE registrations, watch provisioning and both tunnels turn green, try the SSL fallback
- HTTP LB & Origin Pool Wizard: namespace → private origin pool on a CE → Anycast HTTP LB → live `curl` test
- MCN: resolve overlapping CIDRs and classify SMG vs DCG scenarios
- Security & Traffic Burst: launch SQLi, credential stuffing, L7 DDoS and shadow-API traffic against your App Firewall, Bot Defense, DDoS, API and Service Policy settings
- vK8s, RELT & SIEM: deploy to a virtual site, inject a fault, find the culprit from RELT metrics, fire an alert to your SIEM
- GCP Cloud Site Deploy (Module 1): size a production GCP VPC site (credentials, region, two-interface gateway, 3 nodes across 3 zones) and watch it auto-register
- Network Connector & Firewall (Module 2): pick the right egress connector, then build an ordered, least-privilege L3/L4 firewall policy that passes 5 test flows
- Service Policy Builder (Module 3): order allow/deny rules so /admin stays corporate-only, anonymizers and sanctioned countries are dropped, and shoppers still get through
- API Discovery & OAS (Module 3): learn endpoints from traffic, upload a spec, triage four shadow APIs, and enforce fall-through blocking
- Synthetic Monitoring (Module 4): probe the app from five regions, catch a market-specific 403 and trace it to a Service Policy rule
- Namespace RBAC (Module 1): replace pilot-era Admin grants with one least-privilege role and namespace per person
- DNS Load Balancing / GSLB (Module 2): pick policy, health checks and TTL so shoppers reach the nearest healthy region and fail over fast
- mTLS & Client Certs (Module 3): require partner certificates from one CA and forward client identity to the origin
- Malicious User Detection (Module 3): choose user identification and per-threat-level mitigations with zero false positives
- CDN & Caching (Module 4): set per-path TTLs for high offload without stale prices or cached personal data
- CE Upgrade Lifecycle (Module 1): plan a zero-downtime fleet upgrade (canary, pre-checks, rolling clusters, drained single nodes)
- Network Segmentation (Module 2): build a prod / dev / PCI / shared-services connectivity matrix and pass connectivity tests
- Rate Limiting & L3/L4 DDoS (Module 3): pick per-user limits that stop a credential stuffer and scraper but never a NAT office, and know when the RE handles a SYN flood for you
- Client-Side Defense (Module 3): inventory checkout scripts, block a card skimmer, and switch to mitigation
- Alert Routing (Module 4): send each severity to the right receiver and group repeated alerts to stop storms
- Azure VNet Site (Module 1): place a zone-redundant two-interface CE in a hub VNet and steer spokes through it
- BGP Route Advertisement (Module 2): eBGP from the CE inside interface to both DC core routers, advertising only the VIP /32 and withdrawing it when origins fail
- TCP Load Balancer (Module 2): publish an MQTT broker globally with SNI passthrough so the broker keeps device-certificate auth
- WAF False-Positive Tuning (Module 3): fix false positives with path-and-parameter exclusions while real attacks stay blocked
- Blindfold Secrets (Module 4): keep a DB password and TLS private key encrypted end to end, unsealed only on approved sites
- vK8s Autoscaling (Module 4): size requests, min/max replicas, target CPU and scale-down stabilization for Black Friday
- Virtual Sites & Labels (Module 1): write label selectors that match exactly the intended sites
- HTTP LB Routing (Module 2): header and path routes, prefix rewrite, HTTP→HTTPS and retired-URL redirects
- Origin Health & Endpoint Selection (Module 2): HTTP health checks, fast thresholds and local-preferred endpoint selection
- Data Guard & Sensitive Data (Module 3): mask card and ID numbers in responses, exclude the payment callback, discover other leaks
- IP Reputation & Trusted Clients (Module 3): block bad-IP categories and scope trusted-client exceptions by IP, check and expiry
- Canary Releases (Module 4): staff header route, 95/5 weights, RELT promotion gate and instant rollback
- API Credentials & Automation (Module 1): scoped service credentials for Terraform CI, certificates for vesctl, expiry and rotation
- AWS Transit Gateway Site (Module 2): one TGW site for 12 VPCs with east-west inspection through the CE
- Signatures & Threat Campaigns (Module 3): accuracy levels, signature staging, threat campaigns and patch-vs-WAF
- Bot Defense: Endpoints & Mobile (Module 3): protected endpoints, mitigation actions, the mobile SDK and allowed good bots
- Request Log Investigation (Module 4): filter, group and read response flags to find a failing origin instance
- Stateful Edge Workloads (Module 4): storage classes, StatefulSets with PVCs, site-local placement and backups

**Missions**
1. Zero-Trust Multi-Cloud App Delivery: publish a private on-prem app globally without a public IP
2. Black Friday Under Siege: stop four simultaneous attacks at the edge while keeping legit success ≥ 95%
3. Edge Everywhere Rollout: deploy vK8s to 3+ edges, connect overlapping clouds, diagnose a latency regression and alert the SOC

## Project layout

```
src/
  App.jsx                 layout, navigation
  state/GameContext.jsx   XP, badges, events, simulator state, missions (persisted)
  data/                   curriculum, quizzes, missions, ranks/badges/tasks
  sim/                    security and RELT models
  components/
    HUD.jsx, SkillTree.jsx, ModuleView.jsx, MissionView.jsx, Workbench.jsx
    FlowCanvas.jsx        interactive SVG architecture + packet animation
    Inspector.jsx, Quiz.jsx, Toasts.jsx, ui.jsx
    labs/                 the 38 console lab simulators
```

## Disclaimer

Educational simulator. Not affiliated with or endorsed by F5, Inc. Console screens, IPs and metrics are illustrative and simplified.

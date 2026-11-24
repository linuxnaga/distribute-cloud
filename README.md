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
    labs/                 the ten console lab simulators
```

## Disclaimer

Educational simulator. Not affiliated with or endorsed by F5, Inc. Console screens, IPs and metrics are illustrative and simplified.

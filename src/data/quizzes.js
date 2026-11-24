// Five knowledge checks per module. `answer` is the index of the correct option.
export const QUIZZES = {
  m1: [
    {
      q: 'Which part of F5 XC carries no end-user data traffic?',
      options: ['Regional Edge', 'Customer Edge', 'SaaS Control & Management Plane', 'HTTP Load Balancer'],
      answer: 2,
      why: 'The centralized SaaS control plane holds config and policy and pushes it to sites. User traffic flows only through REs and CEs.',
    },
    {
      q: 'After you approve a CE registration, how many Regional Edges does it automatically build tunnels to?',
      options: ['One, the nearest', 'Two, the nearest pair', 'Every RE worldwide', 'None until you configure a VPN'],
      answer: 1,
      why: 'Each CE connects to its two closest REs for redundancy, with no manual VPN configuration.',
    },
    {
      q: 'A corporate firewall blocks UDP 4500. What happens to the CE-to-RE tunnels?',
      options: ['Registration fails', 'They fall back to SSL/TLS tunnels', 'Traffic goes over the public internet unencrypted', 'The CE switches to GRE'],
      answer: 1,
      why: 'IPsec is preferred; if it cannot be established the CE falls back to SSL tunnels so it can still join the fabric securely.',
    },
    {
      q: 'You need high availability for a CE in a single AWS region. What is the standard pattern?',
      options: ['Two single-node sites with DNS failover', 'A 3-node CE cluster across availability zones', 'Run the CE on a Regional Edge', 'A single node with a larger instance type'],
      answer: 1,
      why: 'A 3-node CE cluster provides control-plane quorum and data-plane redundancy within one site.',
    },
    {
      q: 'Where do CE Sites and other infrastructure objects live?',
      options: ['In each application namespace', 'In the "system" namespace', 'In the "shared" namespace', 'Outside any namespace'],
      answer: 1,
      why: '"system" holds infrastructure such as sites and networks. "shared" holds reusable objects, and app namespaces hold LBs and pools.',
    },
  ],
  m2: [
    {
      q: 'You must publish a private on-prem app to internet users without giving it a public IP. Which origin type do you choose?',
      options: ['Public IP of Origin Server', 'Public DNS Name of Origin Server', 'IP address of Origin Server on given Sites', 'A static route on the RE'],
      answer: 2,
      why: '"IP/DNS on given Sites" tells XC to reach the origin through the selected CE on its inside network, so nothing is exposed.',
    },
    {
      q: 'AWS and the data center both use 10.1.0.0/16. How does F5 XC let Service A in AWS call Service B on-prem?',
      options: ['Re-IP one environment first', 'Site Mesh Group routing', 'An L4/L7 distributed load balancer advertised on the AWS CE', 'Enable BGP on the REs'],
      answer: 2,
      why: 'The LB proxies at the app layer: Service A hits a VIP on its local CE and the on-prem CE connects to the origin, so the overlapping ranges never meet.',
    },
    {
      q: 'Twelve branch CEs need direct, encrypted site-to-site connectivity without hairpinning through REs. Which construct fits?',
      options: ['DC Cluster Group', 'Site Mesh Group', 'Virtual Site', 'Origin Pool'],
      answer: 1,
      why: 'A Site Mesh Group builds IPsec/SSL tunnels directly between CE sites in a full mesh or hub-and-spoke.',
    },
    {
      q: 'What is the main difference between a DC Cluster Group and a Site Mesh Group?',
      options: [
        'DCG uses unencrypted IP-in-IP/SRv6 over private connectivity; SMG uses encrypted IPsec/SSL tunnels',
        'DCG only works in AWS',
        'SMG requires REs in the path',
        'There is no difference',
      ],
      answer: 0,
      why: 'DCGs target sites with trusted private connectivity and trade encryption for performance. SMGs encrypt across any underlay.',
    },
    {
      q: 'An HTTP LB is set to "Advertise on Internet". Where does the VIP live?',
      options: ['On the origin server', 'On the CE outside interface', 'On the RE Anycast network', 'In the customer DNS only'],
      answer: 2,
      why: 'Internet advertisement places the VIP on every RE via Anycast, so users enter at the nearest PoP.',
    },
  ],
  m3: [
    {
      q: 'App Firewall is in Monitoring mode during a SQLi attack. What happens?',
      options: ['Attacks are blocked', 'Attacks are logged but still reach the origin', 'The LB goes offline', 'Only bots are blocked'],
      answer: 1,
      why: 'Monitoring mode detects and logs signature hits but forwards the request. Switch to Blocking mode to drop them.',
    },
    {
      q: 'Where are attacks against an Internet-advertised HTTP LB dropped?',
      options: ['At the origin web server', 'At the CE inside interface', 'At the Regional Edge before the tunnel', 'At the SaaS console'],
      answer: 2,
      why: 'Security runs inline on the RE that receives the request, so malicious traffic never consumes tunnel or origin capacity.',
    },
    {
      q: 'Which control is purpose-built to stop credential stuffing from a distributed botnet?',
      options: ['App Firewall signatures', 'Bot Defense', 'A Site Mesh Group', 'Origin health checks'],
      answer: 1,
      why: 'Credential stuffing uses valid-looking requests, so signatures miss it. Bot Defense uses client telemetry to separate automation from humans.',
    },
    {
      q: 'Traffic hits /api/v1/admin/export, which is not in your uploaded OpenAPI spec. What is this called?',
      options: ['A zombie origin', 'A shadow API', 'A virtual site', 'A threat campaign'],
      answer: 1,
      why: 'Shadow APIs are live endpoints missing from the documented schema. API Discovery surfaces them and OAS enforcement can block them.',
    },
    {
      q: 'A Service Policy "deny all except corporate IP range" is attached to a public storefront LB. What is the likely outcome?',
      options: ['Only attacks are blocked', 'Real customers are blocked too', 'No effect on Internet-advertised LBs', 'Bots get a captcha'],
      answer: 1,
      why: 'Broad deny rules are powerful but blunt. On a public app they block legitimate users. Use them for admin paths or private apps.',
    },
  ],
  m4: [
    {
      q: 'What does a Virtual Site do in a vK8s deployment?',
      options: ['Hosts the container registry', 'Selects, by label, which sites and REs receive the workload', 'Encrypts pod traffic', 'Replaces the namespace'],
      answer: 1,
      why: 'A Virtual Site is a label selector. vK8s schedules the workload to every site it matches.',
    },
    {
      q: 'What do the letters in RELT stand for?',
      options: ['Routes, Endpoints, Logs, Traces', 'Requests, Errors, Latency, Throughput', 'Regions, Edges, Links, Tunnels', 'Replicas, Events, Limits, Taints'],
      answer: 1,
      why: 'Requests, Errors, Latency and Throughput are the four golden signals shown for LBs, origins and services.',
    },
    {
      q: 'Which feature streams request and security logs to Splunk or Datadog?',
      options: ['Alert Receiver', 'Global Log Receiver', 'Service Graph', 'Origin Pool'],
      answer: 1,
      why: 'Global Log Receivers export logs to SIEMs and data lakes. Alert receivers deliver alert notifications.',
    },
    {
      q: 'Users in Europe report slowness. Which view shows which service edge has high latency?',
      options: ['Site registration list', 'Service Graph with RELT overlays', 'Namespace RBAC page', 'Certificate manager'],
      answer: 1,
      why: 'The Service Graph colors edges and nodes by RELT health, so the slow hop stands out.',
    },
    {
      q: 'Why run a workload on App Stack CE sites instead of only in a central cloud region?',
      options: ['It is required for WAF', 'To place compute near users and data with one managed K8s API', 'REs cannot route to clouds', 'To avoid using namespaces'],
      answer: 1,
      why: 'App Stack and vK8s put compute at the edge, closer to users and data, while keeping one control plane for all sites.',
    },
  ],
};

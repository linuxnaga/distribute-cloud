import SiteLab from './SiteLab.jsx';
import LoadBalancerLab from './LoadBalancerLab.jsx';
import McnLab from './McnLab.jsx';
import AttackLab from './AttackLab.jsx';
import AppStackLab from './AppStackLab.jsx';
import GcpSiteLab from './GcpSiteLab.jsx';
import FirewallLab from './FirewallLab.jsx';
import ServicePolicyLab from './ServicePolicyLab.jsx';
import ApiDiscoveryLab from './ApiDiscoveryLab.jsx';
import SyntheticLab from './SyntheticLab.jsx';
import RbacLab from './RbacLab.jsx';
import GslbLab from './GslbLab.jsx';
import MtlsLab from './MtlsLab.jsx';
import MaliciousUserLab from './MaliciousUserLab.jsx';
import CdnLab from './CdnLab.jsx';

export const LABS = {
  site: { label: 'Site & Tunnel Registration', C: SiteLab },
  lb: { label: 'HTTP LB & Origin Pool Wizard', C: LoadBalancerLab },
  mcn: { label: 'MCN: Overlap & Mesh Groups', C: McnLab },
  attack: { label: 'Security & Traffic Burst', C: AttackLab },
  appstack: { label: 'vK8s, RELT & SIEM', C: AppStackLab },
  gcp: { label: 'GCP Cloud Site Deploy', C: GcpSiteLab },
  firewall: { label: 'Network Connector & Firewall', C: FirewallLab },
  policy: { label: 'Service Policy Builder', C: ServicePolicyLab },
  api: { label: 'API Discovery & OAS', C: ApiDiscoveryLab },
  synthetic: { label: 'Synthetic Monitoring', C: SyntheticLab },
  rbac: { label: 'Namespace RBAC', C: RbacLab },
  gslb: { label: 'DNS Load Balancing (GSLB)', C: GslbLab },
  mtls: { label: 'mTLS & Client Certs', C: MtlsLab },
  mud: { label: 'Malicious User Detection', C: MaliciousUserLab },
  cdn: { label: 'CDN & Caching', C: CdnLab },
};

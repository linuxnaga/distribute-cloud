import SiteLab from './SiteLab.jsx';
import LoadBalancerLab from './LoadBalancerLab.jsx';
import McnLab from './McnLab.jsx';
import AttackLab from './AttackLab.jsx';
import AppStackLab from './AppStackLab.jsx';

export const LABS = {
  site: { label: 'Site & Tunnel Registration', C: SiteLab },
  lb: { label: 'HTTP LB & Origin Pool Wizard', C: LoadBalancerLab },
  mcn: { label: 'MCN: Overlap & Mesh Groups', C: McnLab },
  attack: { label: 'Security & Traffic Burst', C: AttackLab },
  appstack: { label: 'vK8s, RELT & SIEM', C: AppStackLab },
};

import { Network, Waypoints, ShieldCheck, Boxes, Lock, Siren, Rocket } from 'lucide-react';

export const ICONS = { Network, Waypoints, ShieldCheck, Boxes, Lock, Siren, Rocket };
export const Icon = ({ name, ...props }) => {
  const C = ICONS[name] || Network;
  return <C {...props} />;
};

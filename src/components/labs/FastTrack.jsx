import { FastForward } from 'lucide-react';
import { useGame } from '../../state/GameContext.jsx';
import { MISSIONS } from '../../data/missions.js';
import { SITES } from './SiteLab.jsx';
import { Btn, Callout } from '../ui.jsx';

// Lets learners jump into a later lab even if they skipped Module 1.
export default function FastTrack({ need }) {
  const { state, updateSim } = useGame();
  const missing = need.filter((s) => state.sim.sites[s] !== 'online');
  if (!missing.length) return null;
  // Inside a mission that includes the Site lab, registering the site is an objective.
  const m = state.mission && !state.mission.completedAt && MISSIONS.find((x) => x.id === state.mission.id);
  if (m && m.labs.includes('site')) {
    return <Callout tone="warn" icon={FastForward}>Register {missing.map((s) => SITES[s].name).join(' and ')} in the Site & Tunnel Registration tab first.</Callout>;
  }
  return (
    <Callout tone="warn" icon={FastForward}>
      <div className="flex flex-wrap items-center gap-2">
        <span>
          This lab needs {missing.map((s) => <b key={s} className="font-mono">{SITES[s].name} </b>)} online. Register it in the Site lab (Module 1) for XP, or fast-track it now.
        </span>
        <Btn
          variant="ghost"
          className="!py-1 text-xs"
          onClick={() =>
            updateSim((x) => ({
              ...x,
              sites: { ...x.sites, ...Object.fromEntries(missing.map((m) => [m, 'online'])) },
              provision: { ...x.provision, ...Object.fromEntries(missing.map((m) => [m, 5])) },
            }))
          }
        >
          Fast-track (no XP)
        </Btn>
      </div>
    </Callout>
  );
}

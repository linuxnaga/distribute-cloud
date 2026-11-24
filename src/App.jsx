import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import HUD from './components/HUD.jsx';
import MissionView from './components/MissionView.jsx';
import ModuleView from './components/ModuleView.jsx';
import SkillTree from './components/SkillTree.jsx';
import Toasts from './components/Toasts.jsx';
import { MODULE_BY_ID } from './data/curriculum.js';
import { useGame } from './state/GameContext.jsx';

export default function App() {
  const { state } = useGame();
  const [view, setViewRaw] = useState(() => (state.mission && !state.mission.completedAt ? { type: 'mission', id: state.mission.id } : { type: 'module', id: 'm1' }));
  const [navOpen, setNavOpen] = useState(false);
  const setView = (v) => {
    setViewRaw(v);
    setNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      <HUD />
      <div className="mx-auto flex max-w-[1600px] gap-5 px-4 py-5">
        <aside className="sticky top-[84px] hidden h-[calc(100vh-100px)] w-60 shrink-0 overflow-y-auto scroll-thin lg:block">
          <SkillTree view={view} setView={setView} />
          <Footer />
        </aside>
        <main className="min-w-0 flex-1">
          <button onClick={() => setNavOpen(true)} className="mb-3 flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-sm text-slate-300 lg:hidden">
            <Menu className="h-4 w-4" /> Modules & missions
          </button>
          {view.type === 'module' ? <ModuleView key={view.id} module={MODULE_BY_ID[view.id]} /> : <MissionView key={view.id} id={view.id} />}
        </main>
      </div>

      {navOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 lg:hidden" onClick={() => setNavOpen(false)}>
          <div className="h-full w-72 overflow-y-auto border-r border-line bg-ink p-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setNavOpen(false)} className="mb-3 ml-auto block text-slate-400" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            <SkillTree view={view} setView={setView} />
          </div>
        </div>
      )}
      <Toasts />
    </div>
  );
}

function Footer() {
  return (
    <p className="mt-6 px-1 text-[10px] leading-relaxed text-slate-600">
      Educational simulator. Not affiliated with or endorsed by F5, Inc. Console screens, IPs and metrics are illustrative. Progress is saved in this browser.
    </p>
  );
}

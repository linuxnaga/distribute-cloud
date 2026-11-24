import { useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import FlowCanvas from './FlowCanvas.jsx';
import Inspector from './Inspector.jsx';
import { LABS } from './labs/index.js';

// Split-screen: flow canvas + inspector on the left, console lab on the right.
export default function Workbench({ canvasModule, labIds }) {
  const { inspect } = useGame();
  const [selected, setSelected] = useState(null);
  const [lab, setLab] = useState(labIds[0]);
  const Lab = LABS[lab].C;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="h-[420px] sm:h-[540px]">
          <FlowCanvas
            key={canvasModule.id}
            module={canvasModule}
            selected={selected}
            onSelect={(id) => {
              setSelected(id);
              inspect(id);
            }}
          />
        </div>
        <Inspector nodeId={selected} onClose={() => setSelected(null)} />
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        {labIds.length > 1 && (
          <div className="flex flex-wrap gap-1.5" role="tablist">
            {labIds.map((id, i) => (
              <button
                key={id}
                role="tab"
                aria-selected={lab === id}
                onClick={() => setLab(id)}
                className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${lab === id ? 'border-f5 bg-f5/15 text-white' : 'border-line text-slate-400 hover:text-white'}`}
              >
                <span className="mr-1 font-mono text-slate-500">{i + 1}</span>
                {LABS[id].label}
              </button>
            ))}
          </div>
        )}
        <div className="h-[640px] xl:h-[760px]">
          <Lab key={lab} />
        </div>
      </div>
    </div>
  );
}

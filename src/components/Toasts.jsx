import { Award, Flag, TrendingUp, Zap } from 'lucide-react';
import { useGame } from '../state/GameContext.jsx';

const STYLE = {
  xp: { Icon: Zap, ring: 'border-amber-400/40', icon: 'text-amber-400' },
  badge: { Icon: Award, ring: 'border-cyan/60', icon: 'text-cyan' },
  rank: { Icon: TrendingUp, ring: 'border-f5/60', icon: 'text-coral' },
  mission: { Icon: Flag, ring: 'border-emerald/60', icon: 'text-emerald' },
};

export default function Toasts() {
  const { toasts } = useGame();
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-72 flex-col gap-2" aria-live="polite">
      {toasts.map((t) => {
        const s = STYLE[t.kind] || STYLE.xp;
        return (
          <div key={t.id} className={`toast-in flex items-start gap-3 rounded-lg border bg-panel/95 p-3 shadow-2xl backdrop-blur ${s.ring}`}>
            <s.Icon className={`mt-0.5 h-5 w-5 shrink-0 ${s.icon}`} style={t.color ? { color: t.color } : undefined} />
            <div className="min-w-0">
              <div className="text-sm font-bold text-white">{t.title}</div>
              <div className="text-xs text-slate-300">{t.body}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

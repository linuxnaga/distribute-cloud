import { BookOpen, ChevronDown, FlaskConical, Lightbulb, MapPin, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MODULES } from '../data/curriculum.js';
import { CATEGORIES, REFERENCE } from '../data/reference.js';
import { useReference } from '../state/ReferenceContext.jsx';

const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
const LAB_INFO = Object.fromEntries(MODULES.flatMap((m) => m.labs.map((l) => [l.id, { label: l.label, module: m }])));

export default function ReferenceDrawer() {
  const { isOpen, focusId, closeRef } = useReference();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    if (focusId) {
      setQ('');
      setCat('all');
      setExpanded(focusId);
      // Wait for the list to render, then bring the focused entry into view.
      requestAnimationFrame(() => listRef.current?.querySelector(`[data-ref="${focusId}"]`)?.scrollIntoView({ block: 'start' }));
    }
    const onKey = (e) => e.key === 'Escape' && closeRef();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, focusId, closeRef]);

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return REFERENCE.filter((r) => (cat === 'all' || r.category === cat) && (!needle || `${r.name} ${r.short} ${r.what}`.toLowerCase().includes(needle)));
  }, [q, cat]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/60" onClick={closeRef}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Component reference"
        className="toast-in flex h-full w-full max-w-xl flex-col border-l border-line bg-ink shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-line p-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-cyan" />
            <h2 className="text-base font-bold text-white">Component Reference</h2>
            <span className="text-xs text-slate-500">{REFERENCE.length} building blocks</span>
            <button onClick={closeRef} className="ml-auto rounded p-1 text-slate-400 hover:bg-panel2 hover:text-white" aria-label="Close reference">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-400">What each part of F5 Distributed Cloud does, in plain words, and which labs use it.</p>
          <label className="mt-3 flex items-center gap-2 rounded-md border border-line bg-panel px-2.5 py-1.5 focus-within:border-cyan">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search: tunnel, WAF, origin pool, vK8s…"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
              aria-label="Search components"
            />
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[{ id: 'all', label: 'All', color: '#e2e8f0' }, ...CATEGORIES].map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                aria-pressed={cat === c.id}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cat === c.id ? 'text-ink' : 'border-line text-slate-400 hover:text-white'}`}
                style={cat === c.id ? { background: c.color, borderColor: c.color } : undefined}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 scroll-thin">
          {items.length === 0 && <p className="text-sm text-slate-500">No component matches "{q}".</p>}
          {items.map((r) => {
            const open = expanded === r.id;
            const c = CAT[r.category];
            return (
              <article key={r.id} data-ref={r.id} className={`scroll-mt-2 rounded-lg border bg-panel/70 ${open ? 'border-cyan/50' : 'border-line'}`}>
                <button onClick={() => setExpanded(open ? null : r.id)} aria-expanded={open} className="flex w-full items-start gap-2 p-3 text-left">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-white">{r.name}</span>
                    <span className="block text-xs text-slate-400">{r.short}</span>
                  </span>
                  <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 text-slate-500 transition ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && <RefBody r={r} />}
              </article>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

export function RefBody({ r, compact = false }) {
  return (
    <div className={`space-y-3 text-sm ${compact ? '' : 'border-t border-line px-3 pt-3 pb-3'}`}>
      <p className="leading-relaxed text-slate-300">{r.what}</p>
      <div>
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">What it does</div>
        <ul className="space-y-1">
          {r.does.map((d) => (
            <li key={d} className="flex gap-2 text-xs text-slate-300">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan" />
              {d}
            </li>
          ))}
        </ul>
      </div>
      {r.analogy && (
        <div className="flex gap-2 rounded-md border border-amber-400/30 bg-amber-400/5 p-2 text-xs text-amber-100">
          <Lightbulb className="mt-px h-3.5 w-3.5 shrink-0 text-amber-400" />
          <span>
            <b>Think of it as:</b> {r.analogy}
          </span>
        </div>
      )}
      {r.where && (
        <div className="flex gap-2 text-xs text-slate-400">
          <MapPin className="mt-px h-3.5 w-3.5 shrink-0 text-emerald" />
          <span>
            <b className="text-slate-300">Where you configure it:</b> {r.where}
          </span>
        </div>
      )}
      {!compact && r.labs?.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <FlaskConical className="h-3.5 w-3.5 text-f5" />
          <span className="text-slate-400">Practise it in:</span>
          {r.labs.map((id) => {
            const l = LAB_INFO[id];
            return l ? (
              <span key={id} className="rounded border border-line bg-ink px-1.5 py-0.5 text-[11px] text-slate-300" title={l.module.title}>
                <span style={{ color: l.module.color }}>M{l.module.num}</span> · {l.label}
              </span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}

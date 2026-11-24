import { Check, ChevronRight, Radio, Search } from 'lucide-react';

export function Btn({ children, variant = 'primary', className = '', ...props }) {
  const v = {
    primary: 'bg-f5 text-white hover:bg-[#ff1744] disabled:bg-slate-700 disabled:text-slate-400',
    cyan: 'bg-cyan/90 text-ink hover:bg-cyan disabled:bg-slate-700 disabled:text-slate-400',
    ghost: 'border border-line text-slate-200 hover:border-slate-500 hover:bg-panel2 disabled:opacity-40',
    danger: 'border border-rose-500/50 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20',
  }[variant];
  return (
    <button className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed ${v} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'w-full rounded-md border border-line bg-ink px-2.5 py-1.5 font-mono text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan focus:ring-1 focus:ring-cyan/40';

export function Toggle({ on, onChange, label, desc, color = '#10b981' }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className={`flex w-full items-start gap-3 rounded-lg border p-2.5 text-left transition ${on ? 'bg-panel2' : 'border-line hover:border-slate-600'}`}
      style={on ? { borderColor: `${color}99` } : undefined}
    >
      <span className="relative mt-0.5 inline-block h-5 w-9 shrink-0 rounded-full transition" style={{ background: on ? color : '#334155' }}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
      <span>
        <span className="block text-sm font-semibold text-white">{label}</span>
        {desc && <span className="block text-xs text-slate-400">{desc}</span>}
      </span>
    </button>
  );
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-md border border-line bg-ink p-0.5" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded px-2.5 py-1 text-xs font-semibold transition ${value === o.value ? 'text-ink' : 'text-slate-400 hover:text-white'}`}
          style={value === o.value ? { background: o.color || '#06b6d4' } : undefined}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function StepPill({ n, label, state, onClick }) {
  const cls = state === 'done' ? 'border-emerald/60 text-emerald' : state === 'active' ? 'border-cyan text-white bg-cyan/10' : 'border-line text-slate-500';
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      <span className="grid h-4 w-4 place-items-center rounded-full bg-ink text-[10px]">{state === 'done' ? <Check className="h-3 w-3" /> : n}</span>
      {label}
    </button>
  );
}

const NAV = [
  { group: 'Multi-Cloud Network Connect', items: ['Site Management', 'Networking', 'Site Mesh Groups'] },
  { group: 'Multi-Cloud App Connect', items: ['Load Balancers', 'Origin Pools'] },
  { group: 'Web App & API Protection', items: ['App Firewall', 'Bot Defense', 'API Security', 'Service Policies'] },
  { group: 'Distributed Apps', items: ['Virtual K8s', 'Virtual Sites'] },
  { group: 'Observability', items: ['Service Graph', 'Alerts', 'Log Receivers'] },
];

export function ConsoleFrame({ crumbs, activeNav, namespace, children, right }) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-[#0d1527] shadow-2xl">
      <div className="flex items-center gap-3 border-b border-line bg-[#0a1222] px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-f5" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald" />
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
          <Radio className="h-3.5 w-3.5 text-coral" /> Distributed Cloud Console
          <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-300">Simulator</span>
        </div>
        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <div className="flex items-center gap-1.5 rounded border border-line bg-ink px-2 py-0.5 text-[11px] text-slate-400">
            <Search className="h-3 w-3" /> Search
          </div>
          <div className="rounded border border-line bg-ink px-2 py-0.5 font-mono text-[11px] text-cyan" title="Current namespace">
            ns: {namespace || 'system'}
          </div>
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <nav className="hidden w-40 shrink-0 overflow-y-auto border-r border-line bg-[#0a1222] py-2 text-[11px] min-[1800px]:block scroll-thin">
          {NAV.map((g) => (
            <div key={g.group} className="mb-2">
              <div className="px-3 py-1 font-semibold uppercase tracking-wide text-slate-500">{g.group}</div>
              {g.items.map((i) => (
                <div key={i} className={`px-3 py-1 ${activeNav === i ? 'border-l-2 border-f5 bg-f5/10 text-white' : 'border-l-2 border-transparent text-slate-400'}`}>
                  {i}
                </div>
              ))}
            </div>
          ))}
        </nav>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-1 border-b border-line px-4 py-2 text-xs text-slate-400">
            {crumbs.map((c, i) => (
              <span key={c} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                <span className={i === crumbs.length - 1 ? 'font-semibold text-white' : ''}>{c}</span>
              </span>
            ))}
            {right && <span className="ml-auto">{right}</span>}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 scroll-thin">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Callout({ tone = 'info', children, icon: IconC }) {
  const t = {
    info: 'border-cyan/40 bg-cyan/5 text-cyan-100',
    ok: 'border-emerald/50 bg-emerald/10 text-emerald-100',
    warn: 'border-amber-400/50 bg-amber-400/10 text-amber-100',
    bad: 'border-rose-500/50 bg-rose-500/10 text-rose-100',
  }[tone];
  return (
    <div className={`flex gap-2 rounded-lg border p-2.5 text-xs leading-relaxed ${t}`}>
      {IconC && <IconC className="mt-0.5 h-4 w-4 shrink-0" />}
      <div>{children}</div>
    </div>
  );
}

import { CheckCircle2, ShieldCheck, UserCog, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { Btn, Callout, ConsoleFrame, inputCls } from '../ui.jsx';

const ROLES = ['Admin', 'Developer', 'Security Operator', 'Network Operator', 'Monitor (read-only)'];
const SCOPES = ['system', 'shared', 'acme-shop', 'all namespaces'];

const PEOPLE = [
  {
    id: 'priya',
    name: 'Priya · App developer',
    need: 'Creates and edits the shop HTTP LB, origin pools and routes for the storefront app only.',
    want: { role: 'Developer', scope: 'acme-shop' },
    why: {
      role: 'Developers edit app objects (LBs, pools, routes). Admin would also let her change sites, users and billing.',
      scope: 'Her LB and pools live in the acme-shop app namespace. Granting more namespaces breaks least privilege.',
    },
  },
  {
    id: 'sam',
    name: 'Sam · SecOps engineer',
    need: 'Maintains the reusable App Firewall and Service Policy objects every app team attaches to its LBs.',
    want: { role: 'Security Operator', scope: 'shared' },
    why: {
      role: 'Security Operators manage WAF, bot and service policy objects without touching networking or app routing.',
      scope: 'Objects meant for reuse across app namespaces live in "shared".',
    },
  },
  {
    id: 'lee',
    name: 'Lee · NetOps engineer',
    need: 'Registers CE sites, manages site mesh groups, network connectors and firewalls.',
    want: { role: 'Network Operator', scope: 'system' },
    why: {
      role: 'Network Operators own sites and networking objects.',
      scope: 'Sites and infrastructure objects live in the "system" namespace.',
    },
  },
  {
    id: 'kim',
    name: 'Kim · External auditor',
    need: 'Needs to review every configuration and log across the tenant, and must not change anything.',
    want: { role: 'Monitor (read-only)', scope: 'all namespaces' },
    why: {
      role: 'An auditor needs read-only access. Any write role fails the audit requirement.',
      scope: 'Audit coverage must include every namespace.',
    },
  },
];

export default function RbacLab() {
  const { award, emit } = useGame();
  const [grants, setGrants] = useState(Object.fromEntries(PEOPLE.map((p) => [p.id, { role: 'Admin', scope: 'all namespaces' }])));
  const [checked, setChecked] = useState(false);

  const verdict = (p) => ({ role: grants[p.id].role === p.want.role, scope: grants[p.id].scope === p.want.scope });
  const allOk = PEOPLE.every((p) => {
    const v = verdict(p);
    return v.role && v.scope;
  });

  const check = () => {
    setChecked(true);
    if (allOk) {
      award('m1.rbac');
      emit('rbac.pass');
    }
  };

  return (
    <ConsoleFrame crumbs={['Administration', 'IAM', 'Users & Roles']} activeNav="Site Management" namespace="system">
      <div className="space-y-3">
        <Callout tone="warn" icon={UserCog}>
          During the pilot everyone was made <b>Admin on all namespaces</b>. Before go-live, give each person the least privilege they need: one role, scoped to one namespace.
        </Callout>
        {PEOPLE.map((p) => {
          const v = verdict(p);
          return (
            <div key={p.id} className="rounded-lg border border-line bg-panel/60 p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{p.name}</span>
                {checked && (v.role && v.scope ? <CheckCircle2 className="h-4 w-4 text-emerald" /> : <XCircle className="h-4 w-4 text-rose-400" />)}
              </div>
              <p className="mt-0.5 text-xs text-slate-400">{p.need}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <select aria-label={`${p.name} role`} className={inputCls} value={grants[p.id].role} onChange={(e) => { setGrants((g) => ({ ...g, [p.id]: { ...g[p.id], role: e.target.value } })); setChecked(false); }}>
                  {ROLES.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <select aria-label={`${p.name} namespace`} className={inputCls} value={grants[p.id].scope} onChange={(e) => { setGrants((g) => ({ ...g, [p.id]: { ...g[p.id], scope: e.target.value } })); setChecked(false); }}>
                  {SCOPES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              {checked && !v.role && <p className="mt-1.5 text-[11px] text-rose-300">Role: {p.why.role}</p>}
              {checked && !v.scope && <p className="mt-1.5 text-[11px] text-rose-300">Namespace: {p.why.scope}</p>}
            </div>
          );
        })}
        <Btn onClick={check}>
          <ShieldCheck className="h-4 w-4" /> Run access review
        </Btn>
        {checked && allOk && (
          <Callout tone="ok" icon={CheckCircle2}>
            Access review passed. Every person has exactly one role in exactly the namespace their job needs, so a leaked credential can only damage its own corner of the tenant.
          </Callout>
        )}
      </div>
    </ConsoleFrame>
  );
}

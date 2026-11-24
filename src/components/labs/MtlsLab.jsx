import { CheckCircle2, FileKey2, Play } from 'lucide-react';
import { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { Btn, Callout, ConsoleFrame, Field, Segmented, Toggle, inputCls } from '../ui.jsx';

const CLIENTS = [
  { id: 'partner', label: 'Logistics partner · cert CN=partner-01, signed by Partner CA, valid', cert: 'valid', expect: 'allow' },
  { id: 'expired', label: 'Logistics partner · same CA, certificate expired 3 days ago', cert: 'expired', expect: 'deny' },
  { id: 'nocert', label: 'Unknown client · no client certificate', cert: 'none', expect: 'deny' },
  { id: 'othca', label: 'Attacker · self-signed cert, CN=partner-01', cert: 'untrusted', expect: 'deny' },
];

function outcome(cfg, c) {
  if (cfg.mode === 'tls') return 'allow';
  if (c.cert === 'none') return 'deny';
  if (!cfg.ca) return 'deny';
  if (c.cert === 'untrusted') return cfg.ca === 'any' ? 'allow' : 'deny';
  if (c.cert === 'expired') return 'deny';
  return 'allow';
}

export default function MtlsLab() {
  const { award, emit } = useGame();
  const [cfg, setCfg] = useState({ mode: 'tls', ca: '', xfcc: false });
  const [res, setRes] = useState(null);
  const set = (k, v) => {
    setCfg((c) => ({ ...c, [k]: v }));
    setRes(null);
  };

  const run = () => {
    const rows = CLIENTS.map((c) => ({ ...c, got: outcome(cfg, c) }));
    setRes(rows);
    if (rows.every((r) => r.got === r.expect) && cfg.xfcc) {
      award('m3.mtls');
      emit('mtls.pass');
    }
  };
  const allOk = res && res.every((r) => r.got === r.expect);

  return (
    <ConsoleFrame crumbs={['Web App & API Protection', 'Load Balancers', 'partner-api-lb', 'TLS Settings']} activeNav="API Security" namespace="acme-shop">
      <div className="space-y-3">
        <Callout tone="info" icon={FileKey2}>
          <span className="font-mono">partners.acme.com</span> exposes the order-feed API to one logistics partner. Only that partner's machines, holding certificates from the Partner CA, may connect, and the origin must know which partner called.
        </Callout>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-2.5">
          <span className="text-sm font-semibold text-white">Client authentication</span>
          <Segmented
            value={cfg.mode}
            onChange={(v) => set('mode', v)}
            options={[
              { value: 'tls', label: 'TLS (server cert only)', color: '#64748b' },
              { value: 'mtls', label: 'mTLS (require client cert)', color: '#10b981' },
            ]}
          />
        </div>
        <Field label="Trusted CA for client certificates">
          <select className={inputCls} value={cfg.ca} onChange={(e) => set('ca', e.target.value)} disabled={cfg.mode === 'tls'}>
            <option value="">None selected</option>
            <option value="partner">partner-ca.pem (Partner CA)</option>
            <option value="any">Accept any certificate (skip chain validation)</option>
          </select>
        </Field>
        <Toggle on={cfg.xfcc} onChange={(v) => set('xfcc', v)} label="Forward client certificate info to origin" desc="Adds the x-forwarded-client-cert header (subject, SAN, hash) so the app can authorize per partner" />
        <Btn variant="cyan" onClick={run}>
          <Play className="h-4 w-4" /> Replay 4 client handshakes
        </Btn>
        {res && (
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-xs">
              <tbody>
                {res.map((r) => (
                  <tr key={r.id} className={`border-t border-line first:border-t-0 ${r.got === r.expect ? '' : 'bg-rose-500/10'}`}>
                    <td className="px-2 py-1.5 text-slate-200">{r.label}</td>
                    <td className={`px-2 py-1.5 text-right font-mono font-bold ${r.got === r.expect ? 'text-emerald' : 'text-rose-400'}`}>
                      {r.got === 'allow' ? 'HANDSHAKE OK' : 'REJECTED'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {res && !allOk && <Callout tone="warn">The wrong clients got in. Require a client certificate, and validate it against the Partner CA only. "Accept any certificate" lets a self-signed cert with a copied CN through.</Callout>}
        {allOk && !cfg.xfcc && <Callout tone="warn">The right clients connect, but the origin cannot tell which partner called. Forward the client certificate info.</Callout>}
        {allOk && cfg.xfcc && (
          <Callout tone="ok" icon={CheckCircle2}>
            Only the valid partner certificate completes the handshake at the RE, and the origin receives <span className="font-mono">x-forwarded-client-cert: Subject="CN=partner-01"</span> to authorize the call.
          </Callout>
        )}
      </div>
    </ConsoleFrame>
  );
}

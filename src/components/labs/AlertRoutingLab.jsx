import { Bell, CheckCircle2, Play } from 'lucide-react';
import { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { Btn, Callout, ConsoleFrame, Toggle } from '../ui.jsx';
import ChoiceGrid, { allOk } from './ChoiceGrid.jsx';

const RECV = [['email', 'Email: platform team'], ['pagerduty', 'PagerDuty: on-call'], ['slack', 'Slack: #secops'], ['siem', 'Log only (SIEM)']];
const ITEMS = [
  { id: 'critical', title: 'CRITICAL · All origin pool members down for shop-lb', options: RECV, ok: (v) => v === 'pagerduty', hint: 'A customer-facing outage needs to wake someone up: page on-call.' },
  { id: 'major', title: 'MAJOR · WAF attack spike on shop-lb', options: RECV, ok: (v) => v === 'slack', hint: 'Security teams triage attacks in their channel; the WAF is already blocking, so no page.' },
  { id: 'minor', title: 'MINOR · TLS certificate expires in 30 days', options: RECV, ok: (v) => v === 'email', hint: 'Plenty of time: an email ticket to the owning team is enough.' },
  { id: 'info', title: 'INFO · Configuration change audit event', options: RECV, ok: (v) => v === 'siem', hint: 'Audit events belong in the SIEM for search and compliance, not in anyone\'s inbox.' },
];

export default function AlertRoutingLab() {
  const { award, emit } = useGame();
  const [vals, setVals] = useState({ critical: 'email', major: 'email', minor: 'email', info: 'email' });
  const [group, setGroup] = useState(false);
  const [checked, setChecked] = useState(false);
  const ok = allOk(ITEMS, vals) && group;
  const run = () => {
    setChecked(true);
    if (ok) {
      award('m4.alerts');
      emit('alerts.pass');
    }
  };
  return (
    <ConsoleFrame crumbs={['Observability', 'Alerts', 'Alert Policies & Receivers']} activeNav="Alerts" namespace="acme-shop">
      <div className="space-y-3">
        <Callout tone="info" icon={Bell}>
          Every alert currently goes to one email list and people have stopped reading it. Route each severity to the right receiver and stop alert storms.
        </Callout>
        <ChoiceGrid items={ITEMS} values={vals} checked={checked} onChange={(k, v) => { setVals((s) => ({ ...s, [k]: v })); setChecked(false); }} />
        <Toggle on={group} onChange={(v) => { setGroup(v); setChecked(false); }} label="Group alerts by load balancer and alert name (5 min window)" desc="Collapses repeated firings into one notification with a count" />
        <Btn variant="cyan" onClick={run}>
          <Play className="h-4 w-4" /> Replay Black Friday incident
        </Btn>
        {checked && !group && <Callout tone="bad">The WAF spike fired 214 times in 10 minutes and sent 214 separate notifications. Turn on grouping.</Callout>}
        {checked && !allOk(ITEMS, vals) && <Callout tone="bad">Some alerts went to the wrong place. Check the flagged rows.</Callout>}
        {checked && ok && <Callout tone="ok" icon={CheckCircle2}>On-call was paged once for the outage, #secops got one grouped attack notice (×214), the cert reminder became a ticket, and audit events went quietly to the SIEM.</Callout>}
      </div>
    </ConsoleFrame>
  );
}

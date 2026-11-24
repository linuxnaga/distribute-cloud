// Simple, deterministic model of how each control affects each attack class.
export const ATTACKS = [
  { id: 'sqli', name: 'OWASP SQLi', detail: "GET /search?q=' OR 1=1--", volume: 1200, color: '#f43f5e' },
  { id: 'bot', name: 'Credential Stuffing Bots', detail: 'POST /login from 3,200 residential IPs', volume: 5400, color: '#f59e0b' },
  { id: 'ddos', name: 'L7 DDoS Spike', detail: '48k rps HTTP GET flood on /checkout', volume: 48000, color: '#fb7185' },
  { id: 'api', name: 'Shadow API Probe', detail: 'GET /api/v1/admin/export (not in OAS)', volume: 300, color: '#e879f9' },
];

export const LEGIT_VOLUME = 9000;

// probability that a single control stops one request of a given attack
const EFFECT = {
  wafBlock: { sqli: 1, bot: 0.1, ddos: 0, api: 0.15 },
  bot: { sqli: 0, bot: 1, ddos: 0.3, api: 0 },
  ddos: { sqli: 0, bot: 0.2, ddos: 1, api: 0 },
  api: { sqli: 0.2, bot: 0, ddos: 0, api: 1 },
  ipRep: { sqli: 0.25, bot: 0.4, ddos: 0.3, api: 0.25 },
  denyall: { sqli: 1, bot: 1, ddos: 1, api: 1 },
};

export function activeControls(sec) {
  const c = [];
  if (sec.waf === 'block') c.push('wafBlock');
  if (sec.bot) c.push('bot');
  if (sec.ddos) c.push('ddos');
  if (sec.api) c.push('api');
  if (sec.policy === 'ipRep') c.push('ipRep');
  if (sec.policy === 'denyall') c.push('denyall');
  return c;
}

export function blockFraction(sec, attackId) {
  const pass = activeControls(sec).reduce((p, c) => p * (1 - EFFECT[c][attackId]), 1);
  return 1 - pass;
}

export function attackBlockRate(sec) {
  return ATTACKS.reduce((s, a) => s + blockFraction(sec, a.id), 0) / ATTACKS.length;
}

export function legitSuccess(sec) {
  if (sec.policy === 'denyall') return 0.03;
  let ok = 0.996;
  if (sec.policy === 'ipRep') ok -= 0.003;
  // An unmitigated flood saturates the origin and real users time out.
  ok -= 0.38 * (1 - blockFraction(sec, 'ddos'));
  // Bots that get through lock out real accounts.
  ok -= 0.03 * (1 - blockFraction(sec, 'bot'));
  return Math.max(0, ok);
}

export function runBurst(sec) {
  const attacks = ATTACKS.map((a) => {
    const f = blockFraction(sec, a.id);
    const blocked = Math.round(a.volume * f);
    const detected = sec.waf === 'monitor' && a.id === 'sqli' ? a.volume : 0;
    return { id: a.id, sent: a.volume, blocked, leaked: a.volume - blocked, detected };
  });
  const ok = legitSuccess(sec);
  return {
    at: Date.now(),
    attacks,
    legit: { sent: LEGIT_VOLUME, ok: Math.round(LEGIT_VOLUME * ok), rate: ok },
    clean: attacks.every((a) => a.leaked === 0) && ok >= 0.95,
  };
}

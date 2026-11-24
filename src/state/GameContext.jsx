import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BADGES, TASK_BY_ID, badgeUnlocked, rankFor } from '../data/progression.js';
import { MISSIONS } from '../data/missions.js';

const STORAGE_KEY = 'f5xc-flow-academy:v1';

export const DEFAULT_SECURITY = { waf: 'off', bot: false, ddos: false, api: false, policy: 'none' };
export const DEFAULT_APPSTACK = { deployed: false, sites: [], replicas: 2, fault: null, diagnosed: false, siem: null };

const defaultSim = () => ({
  sites: { aws: 'pending', onprem: 'pending', azure: 'online' },
  provision: { aws: -1, onprem: -1 },
  sslFallback: false,
  namespace: null,
  pool: null,
  lb: null,
  security: { ...DEFAULT_SECURITY },
  lastBurst: null,
  appstack: { ...DEFAULT_APPSTACK },
  mcn: { overlap: false, smg: false },
});

const defaultState = () => ({
  xp: 0,
  awarded: {},
  inspected: [],
  events: [],
  sim: defaultSim(),
  mission: null,
  missionsDone: {},
});

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const base = defaultState();
    const sim = { ...base.sim, ...parsed.sim };
    // A reload mid-provisioning would strand a site; send it back to pending.
    sim.sites = Object.fromEntries(Object.entries(sim.sites).map(([k, v]) => [k, v === 'provisioning' ? 'pending' : v]));
    return { ...base, ...parsed, sim };
  } catch {
    return defaultState();
  }
}

const GameContext = createContext(null);
let toastSeq = 0;

export function GameProvider({ children }) {
  const [state, setState] = useState(load);
  const [toasts, setToasts] = useState([]);
  const prevRef = useRef(state);
  const stateRef = useRef(state);
  stateRef.current = state;
  const getSim = useCallback(() => stateRef.current.sim, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage may be unavailable */
    }
  }, [state]);

  const pushToast = useCallback((toast) => {
    const id = ++toastSeq;
    setToasts((t) => [...t.slice(-3), { id, ...toast }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), toast.kind === 'badge' || toast.kind === 'rank' ? 5200 : 3200);
  }, []);

  // Derive toasts from state transitions (new XP, badges, rank-ups).
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = state;
    if (prev === state) return;
    for (const id of Object.keys(state.awarded)) {
      if (!prev.awarded[id] && TASK_BY_ID[id]) pushToast({ kind: 'xp', title: `+${TASK_BY_ID[id].xp} XP`, body: TASK_BY_ID[id].label });
    }
    for (const b of BADGES) {
      if (badgeUnlocked(b, state.awarded) && !badgeUnlocked(b, prev.awarded)) pushToast({ kind: 'badge', title: 'Badge unlocked', body: b.name, color: b.color });
    }
    const before = rankFor(prev.xp).current;
    const after = rankFor(state.xp).current;
    if (after.level > before.level) pushToast({ kind: 'rank', title: `Rank up · Lvl ${after.level}`, body: after.title });
  }, [state, pushToast]);

  const award = useCallback((id) => {
    setState((s) => {
      if (s.awarded[id] || !TASK_BY_ID[id]) return s;
      return { ...s, awarded: { ...s.awarded, [id]: Date.now() }, xp: s.xp + TASK_BY_ID[id].xp };
    });
  }, []);

  const emit = useCallback((type) => {
    setState((s) => ({ ...s, events: [...s.events.slice(-200), { type, ts: Date.now() }] }));
  }, []);

  const updateSim = useCallback((fn) => {
    setState((s) => ({ ...s, sim: typeof fn === 'function' ? fn(s.sim) : { ...s.sim, ...fn } }));
  }, []);

  const inspect = useCallback((nodeId) => {
    setState((s) => (s.inspected.includes(nodeId) ? s : { ...s, inspected: [...s.inspected, nodeId] }));
  }, []);

  useEffect(() => {
    if (state.inspected.length >= 3) award('m1.inspect');
  }, [state.inspected.length, award]);

  const startMission = useCallback((id) => {
    const m = MISSIONS.find((x) => x.id === id);
    setState((s) => {
      const sim = { ...s.sim };
      const fresh = defaultSim();
      for (const key of m.reset) {
        if (key === 'sites') Object.assign(sim, { sites: fresh.sites, provision: fresh.provision });
        if (key === 'lb') Object.assign(sim, { namespace: null, pool: null, lb: null });
        if (key === 'security') Object.assign(sim, { security: fresh.security, lastBurst: null });
        if (key === 'appstack') sim.appstack = fresh.appstack;
        if (key === 'mcn') sim.mcn = fresh.mcn;
      }
      return { ...s, sim, mission: { id, startedAt: Date.now(), completedAt: null } };
    });
  }, []);

  const exitMission = useCallback(() => setState((s) => ({ ...s, mission: null })), []);

  const resetAll = useCallback(() => {
    setState(defaultState());
  }, []);

  // Mission completion watcher.
  useEffect(() => {
    const active = state.mission;
    if (!active || active.completedAt) return;
    const m = MISSIONS.find((x) => x.id === active.id);
    const done = m.objectives.every((o) => state.events.some((e) => e.type === o.event && e.ts >= active.startedAt));
    if (done) {
      setState((s) => ({
        ...s,
        mission: { ...s.mission, completedAt: Date.now() },
        missionsDone: { ...s.missionsDone, [m.id]: Math.max(1, Math.round((Date.now() - active.startedAt) / 1000)) },
      }));
      award(m.id);
      pushToast({ kind: 'mission', title: 'Mission complete', body: m.title });
    }
  }, [state.events, state.mission, award, pushToast]);

  const value = useMemo(
    () => ({ state, toasts, award, emit, updateSim, getSim, inspect, startMission, exitMission, resetAll, pushToast }),
    [state, toasts, award, emit, updateSim, getSim, inspect, startMission, exitMission, resetAll, pushToast],
  );
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}

export function eventSince(state, type, since) {
  return state.events.some((e) => e.type === type && e.ts >= since);
}

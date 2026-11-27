import { createContext, useCallback, useContext, useMemo, useState } from 'react';

// Opens the Component Reference drawer from anywhere (HUD, inspector, lab guides).
const Ctx = createContext({ isOpen: false, focusId: null, openRef: () => {}, closeRef: () => {} });

export function ReferenceProvider({ children }) {
  const [state, setState] = useState({ isOpen: false, focusId: null });
  const openRef = useCallback((id = null) => setState({ isOpen: true, focusId: id }), []);
  const closeRef = useCallback(() => setState((s) => ({ ...s, isOpen: false })), []);
  const value = useMemo(() => ({ ...state, openRef, closeRef }), [state, openRef, closeRef]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useReference = () => useContext(Ctx);

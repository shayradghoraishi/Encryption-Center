import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const AdvancedModeContext = createContext(null);
const KEY = "enc-advanced-mode";

export function AdvancedModeProvider({ children }) {
  const [advanced, setAdvancedState] = useState(() => localStorage.getItem(KEY) === "1");
  useEffect(() => { localStorage.setItem(KEY, advanced ? "1" : "0"); }, [advanced]);
  const setAdvanced = useCallback((v) => setAdvancedState(v), []);
  const toggle = useCallback(() => setAdvancedState((a) => !a), []);
  return (
    <AdvancedModeContext.Provider value={{ advanced, setAdvanced, toggle }}>
      {children}
    </AdvancedModeContext.Provider>
  );
}

export function useAdvancedMode() {
  const ctx = useContext(AdvancedModeContext);
  if (!ctx) return { advanced: false, setAdvanced: () => {}, toggle: () => {} };
  return ctx;
}
import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";

type Theme = "quantum" | "forest" | "architecture";
type State = { theme: Theme; preset: string };
type Action = { type: "setTheme"; theme: Theme } | { type: "setPreset"; preset: string };

const KEY = "agentarmy_theme";

const defaultState: State = { theme: "quantum", preset: "default" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setTheme":
      return { ...state, theme: action.theme };
    case "setPreset":
      return { ...state, preset: action.preset };
    default:
      return state;
  }
}

const ThemeContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [state, dispatch] = useReducer(reducer, defaultState, () => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as State) : defaultState;
    } catch {
      return defaultState;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeStore() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeStore must be used within ThemeProvider");
  return ctx;
}

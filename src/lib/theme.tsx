import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";

interface ThemeCtx {
  dark: boolean;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx>({ dark: false, toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("safetable-theme");
      if (saved) return saved === "dark";
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("safetable-theme", dark ? "dark" : "light");
    } catch { /* noop */ }
  }, [dark]);

  const toggle = useCallback(() => setDark((d) => !d), []);
  return <Ctx.Provider value={{ dark, toggle }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);

// Chart palette keyed by mode — single source of truth for recharts props
export function useChartColors() {
  const { dark } = useTheme();
  return {
    dark,
    grid: dark ? "rgba(148,163,184,0.09)" : "rgba(100,116,139,0.14)",
    tick: dark ? "#64748b" : "#94a3b8",
    emerald: dark ? "#34d399" : "#10b981",
    teal: dark ? "#2dd4bf" : "#0d9488",
    indigo: dark ? "#818cf8" : "#6366f1",
    amber: dark ? "#fbbf24" : "#f59e0b",
    orange: dark ? "#fb923c" : "#ea580c",
    rose: dark ? "#fb7185" : "#e11d48",
    slate: dark ? "#475569" : "#cbd5e1",
    target: dark ? "#94a3b8" : "#94a3b8",
    tipBg: dark ? "rgba(13,19,26,0.96)" : "rgba(255,255,255,0.97)",
    tipBorder: dark ? "rgba(148,163,184,0.18)" : "rgba(15,23,42,0.08)",
  };
}

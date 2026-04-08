import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { storage } from "../../utils/storage";

export type ThemeMode = "light" | "dark";

const palettes = {
  light: {
    background: "#F4FBF8",
    backgroundElevated: "#FFFFFF",
    backgroundMuted: "#FFF7F2",
    card: "#FFFFFF",
    cardAlt: "#FFF8F3",
    text: "#0F172A",
    textMuted: "#64748B",
    textSoft: "#7B8794",
    border: "#E2E8F0",
    borderSoft: "#F1F5F9",
    accent: "#F08A63",
    accentStrong: "#102A43",
    accentSoft: "#FFE7DC",
    success: "#0F766E",
    danger: "#DC2626",
    overlay: "rgba(15, 23, 42, 0.18)",
    statusBar: "dark" as const,
  },
  dark: {
    background: "#07111A",
    backgroundElevated: "#0B1724",
    backgroundMuted: "#122131",
    card: "#0F1D2B",
    cardAlt: "#132637",
    text: "#F8FAFC",
    textMuted: "#B5C2D0",
    textSoft: "#8EA0B5",
    border: "#223447",
    borderSoft: "#1A2A3B",
    accent: "#F59C78",
    accentStrong: "#F8FAFC",
    accentSoft: "rgba(245, 156, 120, 0.14)",
    success: "#31C48D",
    danger: "#F87171",
    overlay: "rgba(2, 6, 23, 0.55)",
    statusBar: "light" as const,
  },
};

type ThemeColors = {
  background: string;
  backgroundElevated: string;
  backgroundMuted: string;
  card: string;
  cardAlt: string;
  text: string;
  textMuted: string;
  textSoft: string;
  border: string;
  borderSoft: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  success: string;
  danger: string;
  overlay: string;
  statusBar: "dark" | "light";
};

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleMode: () => Promise<void>;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadMode = async () => {
      try {
        const storedMode = await storage.getThemeMode();
        if (mounted && (storedMode === "light" || storedMode === "dark")) {
          setModeState(storedMode);
        }
      } finally {
        if (mounted) {
          setReady(true);
        }
      }
    };

    loadMode();
    return () => {
      mounted = false;
    };
  }, []);

  const setMode = useCallback(async (nextMode: ThemeMode) => {
    setModeState(nextMode);
    await storage.setThemeMode(nextMode);
  }, []);

  const toggleMode = useCallback(async () => {
    const nextMode = mode === "dark" ? "light" : "dark";
    setModeState(nextMode);
    await storage.setThemeMode(nextMode);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      isDark: mode === "dark",
      colors: palettes[mode],
      setMode,
      toggleMode,
      ready,
    }),
    [mode, ready, setMode, toggleMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

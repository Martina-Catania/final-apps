import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import type { ThemeMode } from "../constants";

const THEME_STORAGE_KEY = "recapify.theme.mode";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const systemMode: ThemeMode = systemScheme === "dark" ? "dark" : "light";
  const [mode, setModeState] = useState<ThemeMode>(systemMode);

  useEffect(() => {
    let isMounted = true;

    const loadStoredMode = async () => {
      try {
        const storedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);

        if (!isMounted) {
          return;
        }

        if (storedMode === "light" || storedMode === "dark") {
          setModeState(storedMode);
          return;
        }

        setModeState(systemMode);
      } catch {
        if (isMounted) {
          setModeState(systemMode);
        }
      }
    };

    void loadStoredMode();

    return () => {
      isMounted = false;
    };
  }, [systemMode]);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((currentMode) => {
      const nextMode: ThemeMode = currentMode === "dark" ? "light" : "dark";
      void AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
      return nextMode;
    });
  }, []);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode,
    }),
    [mode, setMode, toggleMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePreference() {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error("useThemePreference must be used within a ThemeProvider");
  }

  return value;
}

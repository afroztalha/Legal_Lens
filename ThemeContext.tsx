"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "dark" | "light";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  colors: typeof darkColors;
};

const darkColors = {
  bgPrimary: "#090d16",
  bgCard: "#111827",
  bgInput: "#0f172a",
  border: "#273147",
  borderHover: "#3b4c72",
  textPrimary: "#e7ebf4",
  textHeading: "#f8fafc",
  textSecondary: "#a6b0c8",
  textMuted: "#6f7a95",
  accent: "#5f7bff",
  accentHover: "#3f5efc",
  sidebarBg: "#080d17",
  sidebarHover: "#15203c",
  sidebarActive: "#1d2d4d",
  navBg: "#09101d",
  dangerBg: "#3c0e14",
  dangerText: "#f26e74",
  overlay: "rgba(8, 10, 18, 0.9)",
  surface: "#111827",
};

const lightColors = {
  bgPrimary: "#f4f6fb",
  bgCard: "#ffffff",
  bgInput: "#f8fafc",
  border: "#d6dce8",
  borderHover: "#b8c6d9",
  textPrimary: "#10203b",
  textHeading: "#0f172a",
  textSecondary: "#56607a",
  textMuted: "#7f8a9e",
  accent: "#3f6dfc",
  accentHover: "#2c54d2",
  sidebarBg: "#ffffff",
  sidebarHover: "#f1f5fb",
  sidebarActive: "#e7f0ff",
  navBg: "#ffffff",
  dangerBg: "#fdefef",
  dangerText: "#b91c1c",
  overlay: "rgba(244, 246, 251, 0.92)",
  surface: "#ffffff",
};

const defaultContext: ThemeContextType = {
  theme: "dark",
  toggleTheme: () => {},
  colors: darkColors,
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("legallens-theme") as Theme | null;
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("legallens-theme", theme);
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme, mounted]);

  function toggleTheme() {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  }

  const colors = theme === "dark" ? darkColors : lightColors;

  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

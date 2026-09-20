"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { generateThemeCssVariables, DEFAULT_THEME_PALETTE_ID } from "@/config/themePalettes";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  palette: string;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setPalette: (paletteId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [palette, setPaletteState] = useState<string>(DEFAULT_THEME_PALETTE_ID);

  const applyTheme = (newTheme: Theme) => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", newTheme);
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const applyPalette = (paletteId: string) => {
    if (typeof document !== "undefined") {
      let styleTag = document.getElementById("vibemart-theme-vars");
      if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "vibemart-theme-vars";
        document.head.appendChild(styleTag);
      }
      styleTag.innerHTML = generateThemeCssVariables(paletteId);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("vibemart_theme") as Theme | null;
    let initialTheme: Theme = "light";
    if (savedTheme === "dark" || savedTheme === "light") {
      initialTheme = savedTheme;
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      initialTheme = "dark";
    }
    setThemeState(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("vibemart_theme", newTheme);
    applyTheme(newTheme);
  };

  const setPalette = (paletteId: string) => {
    setPaletteState(paletteId);
    applyPalette(paletteId);
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, palette, toggleTheme, setTheme, setPalette }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}


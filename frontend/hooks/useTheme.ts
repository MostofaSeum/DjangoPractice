import { useTheme as useThemeFromStore } from "@/store/ThemeContext";

export function useTheme() {
  return useThemeFromStore();
}

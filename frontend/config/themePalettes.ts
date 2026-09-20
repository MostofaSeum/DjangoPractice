export interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  buttonBg: string;
  buttonFg: string;
  logoColor: string;
}

export interface ThemePalette {
  id: string;
  name: string;
  nameBn: string;
  description: string;
  descriptionBn: string;
  preview: {
    primary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  light: ThemeColors;
  dark: ThemeColors;
}

export const THEME_PALETTES: Record<string, ThemePalette> = {
  botanical_lilac: {
    id: "botanical_lilac",
    name: "Botanical Lilac",
    nameBn: "বোটানিক্যাল লাইলাক",
    description: "Soft lilac & dusty lavender luxury cosmetics aesthetic",
    descriptionBn: "নরম লাইলাক ও ল্যাভেন্ডার লাক্সারি রূপচর্চা থিম",
    preview: {
      primary: "#836e9f",
      accent: "#9f84bf",
      background: "#f8f6fa",
      foreground: "#2b2236",
    },
    light: {
      background: "#f8f6fa",
      foreground: "#2b2236",
      primary: "#836e9f",
      secondary: "#ffffff",
      accent: "#9f84bf",
      buttonBg: "#836e9f",
      buttonFg: "#ffffff",
      logoColor: "#ffffff",
    },
    dark: {
      background: "#1b1624",
      foreground: "#f3edf8",
      primary: "#272033",
      secondary: "#221c2e",
      accent: "#c4a9e5",
      buttonBg: "#8e74ad",
      buttonFg: "#ffffff",
      logoColor: "#f3edf8",
    },
  },
  rose_blush: {
    id: "rose_blush",
    name: "Rose & Blush",
    nameBn: "রোজ ও ব্লাশ",
    description: "Warm rose gold, petal pink & soft berry cosmetics vibe",
    descriptionBn: "উষ্ণ রোজ গোল্ড ও কোমল গোলাপী কসমেটিকস থিম",
    preview: {
      primary: "#b85d77",
      accent: "#d47a94",
      background: "#faf5f7",
      foreground: "#381e26",
    },
    light: {
      background: "#faf5f7",
      foreground: "#381e26",
      primary: "#b85d77",
      secondary: "#ffffff",
      accent: "#d47a94",
      buttonBg: "#b85d77",
      buttonFg: "#ffffff",
      logoColor: "#ffffff",
    },
    dark: {
      background: "#1e1317",
      foreground: "#f8edf1",
      primary: "#2e1a22",
      secondary: "#27161d",
      accent: "#e58da5",
      buttonBg: "#b85d77",
      buttonFg: "#ffffff",
      logoColor: "#f8edf1",
    },
  },
  emerald_luxury: {
    id: "emerald_luxury",
    name: "Emerald & Herbal",
    nameBn: "এমেরাল্ড ও হারবাল",
    description: "Deep botanical green & organic natural skincare tones",
    descriptionBn: "ন্যাচারাল ভেষজ ও অর্গানিক রূপচর্চা থিম",
    preview: {
      primary: "#2d6a4f",
      accent: "#52b788",
      background: "#f4f9f6",
      foreground: "#1b3327",
    },
    light: {
      background: "#f4f9f6",
      foreground: "#1b3327",
      primary: "#2d6a4f",
      secondary: "#ffffff",
      accent: "#52b788",
      buttonBg: "#2d6a4f",
      buttonFg: "#ffffff",
      logoColor: "#ffffff",
    },
    dark: {
      background: "#122019",
      foreground: "#e8f5ee",
      primary: "#1b3327",
      secondary: "#16281f",
      accent: "#74c69d",
      buttonBg: "#40916c",
      buttonFg: "#ffffff",
      logoColor: "#e8f5ee",
    },
  },
  champagne_gold: {
    id: "champagne_gold",
    name: "Champagne & Noir",
    nameBn: "শ্যাম্পেন ও নোয়ার",
    description: "Timeless Parisian monochrome with warm gold & bronze",
    descriptionBn: "অভিজাত ব্ল্যাক ও শ্যাম্পেন গোল্ড লাক্সারি থিম",
    preview: {
      primary: "#9c7c38",
      accent: "#bfa054",
      background: "#faf8f5",
      foreground: "#24201a",
    },
    light: {
      background: "#faf8f5",
      foreground: "#24201a",
      primary: "#9c7c38",
      secondary: "#ffffff",
      accent: "#bfa054",
      buttonBg: "#9c7c38",
      buttonFg: "#ffffff",
      logoColor: "#ffffff",
    },
    dark: {
      background: "#191714",
      foreground: "#f7f3ec",
      primary: "#26221c",
      secondary: "#201c17",
      accent: "#d4b872",
      buttonBg: "#ab8c44",
      buttonFg: "#ffffff",
      logoColor: "#f7f3ec",
    },
  },
  sunset_coral: {
    id: "sunset_coral",
    name: "Sunset Coral",
    nameBn: "সানসেট কোরাল",
    description: "Vibrant peachy coral & terracotta glow for trendsetters",
    descriptionBn: "উজ্জ্বল কোরাল ও টেরাকোটা ফ্যাশন থিম",
    preview: {
      primary: "#c85a44",
      accent: "#e07a5f",
      background: "#faf6f4",
      foreground: "#351e18",
    },
    light: {
      background: "#faf6f4",
      foreground: "#351e18",
      primary: "#c85a44",
      secondary: "#ffffff",
      accent: "#e07a5f",
      buttonBg: "#c85a44",
      buttonFg: "#ffffff",
      logoColor: "#ffffff",
    },
    dark: {
      background: "#1f1513",
      foreground: "#f9edea",
      primary: "#2f1e1a",
      secondary: "#271916",
      accent: "#ea8c73",
      buttonBg: "#c85a44",
      buttonFg: "#ffffff",
      logoColor: "#f9edea",
    },
  },
  warm_sand: {
    id: "warm_sand",
    name: "Warm Sand & Espresso",
    nameBn: "ওয়ার্ম স্যান্ড ও এসপ্রেসো",
    description: "Minimalist warm beige sand canvas with deep espresso contrast",
    descriptionBn: "কোমল উষ্ণ বেইজ স্যান্ড ক্যানভাস ও ডিপ এসপ্রেসো লাক্সারি থিম",
    preview: {
      primary: "#3c3836",
      accent: "#bdae93",
      background: "#e8e1d5",
      foreground: "#282828",
    },
    light: {
      background: "#e8e1d5",
      foreground: "#282828",
      primary: "#3c3836",
      secondary: "#ffffff",
      accent: "#8a7e6b",
      buttonBg: "#3c3836",
      buttonFg: "#ffffff",
      logoColor: "#ffffff",
    },
    dark: {
      background: "#1d2021",
      foreground: "#ebdbb2",
      primary: "#282828",
      secondary: "#32302f",
      accent: "#d5c4a1",
      buttonBg: "#504945",
      buttonFg: "#ffffff",
      logoColor: "#ebdbb2",
    },
  },
};

export const DEFAULT_THEME_PALETTE_ID = "botanical_lilac";

export function generateThemeCssVariables(paletteId: string): string {
  const palette = THEME_PALETTES[paletteId] || THEME_PALETTES[DEFAULT_THEME_PALETTE_ID];
  const { light, dark } = palette;

  return `
    :root {
      --background: ${light.background};
      --foreground: ${light.foreground};
      --primary: ${light.primary};
      --secondary: ${light.secondary};
      --accent: ${light.accent};
      --button-bg: ${light.buttonBg};
      --button-fg: ${light.buttonFg};
      --logo-color: ${light.logoColor};
    }
    html[data-theme="dark"], .dark {
      --background: ${dark.background};
      --foreground: ${dark.foreground};
      --primary: ${dark.primary};
      --secondary: ${dark.secondary};
      --accent: ${dark.accent};
      --button-bg: ${dark.buttonBg};
      --button-fg: ${dark.buttonFg};
      --logo-color: ${dark.logoColor};
    }
  `;
}

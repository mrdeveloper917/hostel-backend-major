import { useColorScheme } from "react-native";

const palette = {
  light: {
    background: "#f4f7fb",
    surface: "#ffffff",
    surfaceAlt: "#eef3f8",
    text: "#112031",
    textMuted: "#64748b",
    primary: "#1d4ed8",
    primarySoft: "#dbeafe",
    success: "#16a34a",
    warning: "#f59e0b",
    danger: "#ef4444",
    border: "#dbe4ee",
    bubbleMine: "#1d4ed8",
    bubbleOther: "#ffffff",
    input: "#f8fafc",
    shadow: "rgba(15, 23, 42, 0.08)",
  },
  dark: {
    background: "#09111f",
    surface: "#101b2d",
    surfaceAlt: "#14233a",
    text: "#f8fafc",
    textMuted: "#94a3b8",
    primary: "#60a5fa",
    primarySoft: "rgba(96, 165, 250, 0.15)",
    success: "#4ade80",
    warning: "#fbbf24",
    danger: "#f87171",
    border: "#22314a",
    bubbleMine: "#2563eb",
    bubbleOther: "#132238",
    input: "#0f172a",
    shadow: "rgba(2, 6, 23, 0.35)",
  },
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
};

export const typography = {
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 16, fontWeight: "600" },
  body: { fontSize: 15, fontWeight: "400" },
  caption: { fontSize: 12, fontWeight: "500" },
};

export const useAppTheme = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  return {
    isDark,
    colors: isDark ? palette.dark : palette.light,
    spacing,
    radius,
    typography,
  };
};

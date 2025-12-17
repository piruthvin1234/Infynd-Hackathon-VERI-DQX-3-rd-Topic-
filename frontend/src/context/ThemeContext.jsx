import { createContext, useContext, useState, useEffect } from "react";

// 3 Best Corporate Themes for DataGuardian AI
export const THEMES = {
    "executive-health": {
        id: "executive-health",
        name: "Executive Data Health",
        description: "C-Suite dashboard with neon accents",
        dark: {
            primary: "#000000", // Pure black
            secondary: "#000000", // Pure black for seamless depth
            accent1: "#22d3ee",
            accent2: "#8b5cf6",
            textPrimary: "#f8fafc",
            textSecondary: "#cbd5e1",
            cardBg: "rgba(0, 0, 0, 0.7)", // More transparency, pure black base
            border: "rgba(34, 211, 238, 0.2)",
        },
        light: {
            primary: "#f0f9ff",
            secondary: "#e0f2fe",
            accent1: "#06b6d4",
            accent2: "#7c3aed",
            textPrimary: "#0f172a",
            textSecondary: "#475569",
            cardBg: "rgba(255, 255, 255, 0.9)",
            border: "rgba(148, 163, 184, 0.2)",
        },
    },
    "revops-ready": {
        id: "revops-ready",
        name: "RevOps Data Readiness",
        description: "Blue SaaS palette for marketing & sales ops",
        dark: {
            primary: "#020617",
            secondary: "#1e40af",
            accent1: "#0ea5e9",
            accent2: "#6366f1",
            textPrimary: "#dbeafe",
            textSecondary: "#93c5fd",
            cardBg: "rgba(30, 64, 175, 0.6)",
            border: "rgba(96, 165, 250, 0.7)",
        },
        light: {
            primary: "#eff6ff",
            secondary: "#dbeafe",
            accent1: "#0284c7",
            accent2: "#4f46e5",
            textPrimary: "#1e3a8a",
            textSecondary: "#1e40af",
            cardBg: "rgba(255, 255, 255, 0.9)",
            border: "rgba(37, 99, 235, 0.2)",
        },
    },
    "ai-copilot": {
        id: "ai-copilot",
        name: "AI Copilot",
        description: "Magenta/violet for prompt-first UX",
        dark: {
            primary: "#09000a", // Almost black
            secondary: "#1a0521",
            accent1: "#ec4899",
            accent2: "#a855f7",
            textPrimary: "#fce7f3",
            textSecondary: "#fbcfe8",
            cardBg: "rgba(26, 5, 33, 0.8)",
            border: "rgba(236, 72, 153, 0.3)",
        },
        light: {
            primary: "#fdf2f8",
            secondary: "#fce7f3",
            accent1: "#db2777",
            accent2: "#9333ea",
            textPrimary: "#831843",
            textSecondary: "#9f1239",
            cardBg: "rgba(255, 255, 255, 0.9)",
            border: "rgba(219, 39, 119, 0.2)",
        },
    },
};

const DEFAULT_THEME = "executive-health";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem("darkMode");
        return saved ? saved === "true" : true;
    });

    const [currentTheme, setCurrentTheme] = useState(() => {
        const saved = localStorage.getItem("theme");
        // Validate that the saved theme exists
        if (saved && THEMES[saved]) {
            return saved;
        }
        return DEFAULT_THEME;
    });

    useEffect(() => {
        localStorage.setItem("darkMode", isDarkMode.toString());
        localStorage.setItem("theme", currentTheme);
    }, [isDarkMode, currentTheme]);

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    const getColors = () => {
        const theme = THEMES[currentTheme] || THEMES[DEFAULT_THEME];
        return isDarkMode ? theme.dark : theme.light;
    };

    const getThemeInfo = () => THEMES[currentTheme] || THEMES[DEFAULT_THEME];

    return (
        <ThemeContext.Provider
            value={{
                isDarkMode,
                toggleDarkMode,
                currentTheme,
                setCurrentTheme,
                getColors,
                getThemeInfo,
                themes: THEMES,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return context;
}

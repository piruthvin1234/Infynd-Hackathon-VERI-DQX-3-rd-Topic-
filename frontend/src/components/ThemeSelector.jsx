import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Check, Moon, Sun, ChevronDown } from "lucide-react";
import { useTheme, THEMES } from "../context/ThemeContext";

// Theme hover effect configurations
const THEME_HOVER_STYLES = {
    "quantum-blue": {
        hoverClass: "font-sans tracking-wide",
        style: {
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 0 20px rgba(59, 130, 246, 0.5)",
        },
        animation: { scale: 1.02, x: 5 },
        badge: "🌌",
    },
    "emerald-command": {
        hoverClass: "font-mono uppercase tracking-widest",
        style: {
            color: "#10b981",
            textShadow: "0 0 15px rgba(16, 185, 129, 0.6)",
        },
        animation: { scale: 1.02, x: 5 },
        badge: "💼",
    },
    "emerald-comfort": {
        hoverClass: "font-serif italic",
        style: {
            color: "#8bbd8b",
            textShadow: "0 0 10px rgba(139, 189, 139, 0.4)",
        },
        animation: { scale: 1.02 },
        badge: "👁️",
    },
    "neon-protocol": {
        hoverClass: "font-mono uppercase",
        style: {
            color: "#06b6d4",
            textShadow: "0 0 5px #06b6d4, 0 0 10px #06b6d4, 0 0 20px #8b5cf6",
        },
        animation: { scale: 1.02, x: 3 },
        badge: "⚡",
    },
    "solarized-pro": {
        hoverClass: "font-serif tracking-wide",
        style: {
            background: "linear-gradient(90deg, #b58900, #ffd700, #b58900)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
        },
        animation: { scale: 1.02 },
        badge: "☀️",
    },
    "midnight-matrix": {
        hoverClass: "font-mono uppercase",
        style: {
            color: "#10b981",
            textShadow: "0 0 5px #10b981, 0 0 10px #10b981",
            fontWeight: "bold",
        },
        animation: { scale: 1.02 },
        badge: "🖥️",
    },
    "arctic-data": {
        hoverClass: "font-light tracking-widest",
        style: {
            background: "linear-gradient(135deg, #38bdf8, #ffffff, #38bdf8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
        },
        animation: { scale: 1.02 },
        badge: "❄️",
    },
    "sunset-analytics": {
        hoverClass: "font-bold tracking-wide",
        style: {
            background: "linear-gradient(135deg, #f97316, #c026d3)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
        },
        animation: { scale: 1.02 },
        badge: "🌅",
    },
    "violet-shield": {
        hoverClass: "font-serif uppercase",
        style: {
            background: "linear-gradient(135deg, #8b5cf6, #f59e0b, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
        },
        animation: { scale: 1.02 },
        badge: "👑",
    },
    "carbon-fiber": {
        hoverClass: "font-bold uppercase tracking-widest",
        style: {
            color: "#f5f5f5",
            textShadow: "1px 1px 0 #3b82f6",
        },
        animation: { scale: 1.02 },
        badge: "⚙️",
    },
};

export default function ThemeSelector() {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredTheme, setHoveredTheme] = useState(null);
    const { isDarkMode, toggleDarkMode, currentTheme, setCurrentTheme, getColors } = useTheme();
    const colors = getColors();
    const dropdownRef = useRef(null);

    const themeList = Object.values(THEMES);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleDarkMode}
                className="p-2 rounded-xl transition-all duration-300"
                style={{
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                }}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
                <motion.div
                    initial={false}
                    animate={{ rotate: isDarkMode ? 0 : 180 }}
                    transition={{ duration: 0.3 }}
                >
                    {isDarkMode ? (
                        <Sun className="w-5 h-5" style={{ color: colors.accent2 }} />
                    ) : (
                        <Moon className="w-5 h-5" style={{ color: colors.accent1 }} />
                    )}
                </motion.div>
            </motion.button>

            {/* Theme Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300"
                    style={{
                        backgroundColor: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                    }}
                    title="Select Theme"
                >
                    <Palette className="w-5 h-5" style={{ color: colors.accent1 }} />
                    <span className="text-sm hidden sm:inline" style={{ color: colors.textPrimary }}>
                        Theme
                    </span>
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="w-4 h-4" style={{ color: colors.textSecondary }} />
                    </motion.div>
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ type: "spring", damping: 25, stiffness: 400 }}
                            className="absolute right-0 mt-2 w-72 max-h-[70vh] overflow-y-auto rounded-2xl shadow-2xl z-50"
                            style={{
                                backgroundColor: colors.primary,
                                border: `1px solid ${colors.border}`,
                            }}
                        >
                            {/* Header */}
                            <div
                                className="sticky top-0 px-4 py-3 border-b backdrop-blur-xl z-10"
                                style={{
                                    backgroundColor: colors.primary,
                                    borderColor: colors.border,
                                }}
                            >
                                <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                                    🎨 Select Theme
                                </p>
                                <p className="text-xs" style={{ color: colors.textSecondary }}>
                                    Hover to preview
                                </p>
                            </div>

                            {/* Theme List */}
                            <div className="p-2">
                                {themeList.map((theme, index) => {
                                    const isActive = currentTheme === theme.id;
                                    const isHovered = hoveredTheme === theme.id;
                                    const hoverConfig = THEME_HOVER_STYLES[theme.id];
                                    const previewColors = isDarkMode ? theme.dark : theme.light;

                                    return (
                                        <motion.button
                                            key={theme.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            whileHover={hoverConfig?.animation || { scale: 1.02 }}
                                            onClick={() => {
                                                setCurrentTheme(theme.id);
                                                setIsOpen(false);
                                            }}
                                            onMouseEnter={() => setHoveredTheme(theme.id)}
                                            onMouseLeave={() => setHoveredTheme(null)}
                                            className="w-full p-3 rounded-xl text-left transition-all duration-200 mb-1"
                                            style={{
                                                backgroundColor: isActive
                                                    ? `${previewColors.accent1}25`
                                                    : isHovered
                                                        ? colors.cardBg
                                                        : "transparent",
                                                border: isActive
                                                    ? `1px solid ${previewColors.accent1}`
                                                    : "1px solid transparent",
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {/* Badge */}
                                                    <span className="text-lg">{hoverConfig?.badge || "🎨"}</span>

                                                    {/* Color Dots */}
                                                    <div className="flex gap-1">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: previewColors.accent1 }}
                                                        />
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: previewColors.accent2 }}
                                                        />
                                                    </div>

                                                    {/* Theme Name */}
                                                    <motion.span
                                                        className={`text-sm font-medium transition-all duration-200 ${isHovered ? hoverConfig?.hoverClass : ""
                                                            }`}
                                                        style={
                                                            isHovered
                                                                ? hoverConfig?.style
                                                                : { color: colors.textPrimary }
                                                        }
                                                    >
                                                        {theme.name}
                                                    </motion.span>
                                                </div>

                                                {/* Check mark */}
                                                {isActive && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="p-1 rounded-full"
                                                        style={{ backgroundColor: previewColors.accent1 }}
                                                    >
                                                        <Check className="w-3 h-3 text-white" />
                                                    </motion.div>
                                                )}
                                            </div>

                                            {/* Description on hover */}
                                            <AnimatePresence>
                                                {isHovered && (
                                                    <motion.p
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="text-xs mt-2 pl-8"
                                                        style={{ color: colors.textSecondary }}
                                                    >
                                                        {theme.description}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div
                                className="sticky bottom-0 px-4 py-3 border-t backdrop-blur-xl"
                                style={{
                                    backgroundColor: colors.primary,
                                    borderColor: colors.border,
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs" style={{ color: colors.textSecondary }}>
                                        {isDarkMode ? "🌙 Dark" : "☀️ Light"} Mode
                                    </span>
                                    <span className="text-xs" style={{ color: colors.accent1 }}>
                                        ✓ {THEMES[currentTheme]?.name}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

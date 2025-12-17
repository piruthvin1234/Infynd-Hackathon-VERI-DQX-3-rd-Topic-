import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Settings as SettingsIcon,
    Palette,
    Moon,
    Sun,
    Monitor,
    Check,
} from "lucide-react";
import { useTheme, THEMES } from "../context/ThemeContext";
import Header from "../components/Header";

export default function Settings() {
    const navigate = useNavigate();
    const {
        isDarkMode,
        toggleDarkMode,
        currentTheme,
        setCurrentTheme,
        getColors,
    } = useTheme();
    const colors = getColors();

    const [activeTab, setActiveTab] = useState("appearance");

    const tabs = [
        { id: "appearance", label: "Appearance", icon: Palette },
    ];

    return (
        <div
            className="min-h-screen transition-colors duration-500"
            style={{ backgroundColor: colors.primary }}
        >
            {/* Background pattern */}
            <div className="fixed inset-0 opacity-5 pointer-events-none">
                <img src="/logo.jpg" alt="" className="w-full h-full object-cover" />
            </div>

            {/* Global Header */}
            <Header />

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div
                        className="p-4 rounded-2xl"
                        style={{
                            background: `linear-gradient(135deg, ${colors.accent1}, ${colors.accent2})`,
                        }}
                    >
                        <SettingsIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1
                            className="text-3xl font-bold"
                            style={{ color: colors.textPrimary }}
                        >
                            Settings
                        </h1>
                        <p style={{ color: colors.textSecondary }}>
                            Customize your experience
                        </p>
                    </div>
                </div>

                {/* Settings Card */}
                <div
                    className="rounded-3xl shadow-2xl overflow-hidden transition-colors duration-500"
                    style={{
                        backgroundColor: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                    }}
                >
                    {/* Tabs */}
                    <div
                        className="flex border-b"
                        style={{ borderColor: colors.border }}
                    >
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className="flex items-center gap-2 px-6 py-4 transition-all"
                                style={{
                                    color:
                                        activeTab === tab.id
                                            ? colors.accent1
                                            : colors.textSecondary,
                                    borderBottom:
                                        activeTab === tab.id
                                            ? `2px solid ${colors.accent1}`
                                            : "2px solid transparent",
                                }}
                            >
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        {activeTab === "appearance" && (
                            <div className="space-y-8">
                                {/* Dark Mode Toggle */}
                                <div>
                                    <h3
                                        className="text-lg font-semibold mb-4"
                                        style={{ color: colors.textPrimary }}
                                    >
                                        Display Mode
                                    </h3>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => isDarkMode && toggleDarkMode()}
                                            className={`flex-1 p-6 rounded-2xl transition-all duration-300 ${!isDarkMode ? "ring-2" : ""
                                                }`}
                                            style={{
                                                backgroundColor: colors.secondary,
                                                border: `1px solid ${colors.border}`,
                                                ringColor: colors.accent1,
                                            }}
                                        >
                                            <div className="flex flex-col items-center gap-3">
                                                <div
                                                    className="p-3 rounded-xl"
                                                    style={{
                                                        backgroundColor: !isDarkMode
                                                            ? `${colors.accent1}20`
                                                            : colors.cardBg,
                                                    }}
                                                >
                                                    <Sun
                                                        className="w-8 h-8"
                                                        style={{
                                                            color: !isDarkMode
                                                                ? colors.accent1
                                                                : colors.textSecondary,
                                                        }}
                                                    />
                                                </div>
                                                <span
                                                    className="font-medium"
                                                    style={{
                                                        color: !isDarkMode
                                                            ? colors.accent1
                                                            : colors.textSecondary,
                                                    }}
                                                >
                                                    Light Mode
                                                </span>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => !isDarkMode && toggleDarkMode()}
                                            className={`flex-1 p-6 rounded-2xl transition-all duration-300 ${isDarkMode ? "ring-2" : ""
                                                }`}
                                            style={{
                                                backgroundColor: colors.secondary,
                                                border: `1px solid ${colors.border}`,
                                                ringColor: colors.accent1,
                                            }}
                                        >
                                            <div className="flex flex-col items-center gap-3">
                                                <div
                                                    className="p-3 rounded-xl"
                                                    style={{
                                                        backgroundColor: isDarkMode
                                                            ? `${colors.accent1}20`
                                                            : colors.cardBg,
                                                    }}
                                                >
                                                    <Moon
                                                        className="w-8 h-8"
                                                        style={{
                                                            color: isDarkMode
                                                                ? colors.accent1
                                                                : colors.textSecondary,
                                                        }}
                                                    />
                                                </div>
                                                <span
                                                    className="font-medium"
                                                    style={{
                                                        color: isDarkMode
                                                            ? colors.accent1
                                                            : colors.textSecondary,
                                                    }}
                                                >
                                                    Dark Mode
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Theme Selection */}
                                <div>
                                    <h3
                                        className="text-lg font-semibold mb-4"
                                        style={{ color: colors.textPrimary }}
                                    >
                                        Color Theme
                                    </h3>
                                    <p
                                        className="text-sm mb-6"
                                        style={{ color: colors.textSecondary }}
                                    >
                                        Choose a theme that suits your style
                                    </p>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {Object.values(THEMES).map((theme) => (
                                            <button
                                                key={theme.id}
                                                onClick={() => setCurrentTheme(theme.id)}
                                                className={`relative p-4 rounded-2xl transition-all duration-300 hover:scale-105 ${currentTheme === theme.id ? "ring-2" : ""
                                                    }`}
                                                style={{
                                                    backgroundColor: colors.secondary,
                                                    border: `1px solid ${colors.border}`,
                                                    ringColor: colors.accent1,
                                                }}
                                            >
                                                {/* Theme preview colors */}
                                                <div className="flex gap-1 mb-3">
                                                    <div
                                                        className="w-6 h-6 rounded-full"
                                                        style={{
                                                            backgroundColor: theme.dark.accent1,
                                                        }}
                                                    />
                                                    <div
                                                        className="w-6 h-6 rounded-full"
                                                        style={{
                                                            backgroundColor: theme.dark.accent2,
                                                        }}
                                                    />
                                                    <div
                                                        className="w-6 h-6 rounded-full"
                                                        style={{
                                                            backgroundColor: theme.dark.primary,
                                                        }}
                                                    />
                                                </div>

                                                <div className="text-left">
                                                    <p
                                                        className="font-medium text-sm"
                                                        style={{ color: colors.textPrimary }}
                                                    >
                                                        {theme.name}
                                                    </p>
                                                    <p
                                                        className="text-xs"
                                                        style={{ color: colors.textSecondary }}
                                                    >
                                                        {theme.description}
                                                    </p>
                                                </div>

                                                {currentTheme === theme.id && (
                                                    <div
                                                        className="absolute top-2 right-2 p-1 rounded-full"
                                                        style={{
                                                            backgroundColor: colors.accent1,
                                                        }}
                                                    >
                                                        <Check className="w-3 h-3 text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

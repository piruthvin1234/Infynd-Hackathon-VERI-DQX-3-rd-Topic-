import { useNavigate } from "react-router-dom";
import { LogOut, Settings, FolderOpen, LayoutDashboard } from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import ProfileAvatar from "./ProfileAvatar";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";

export default function Header() {
    const navigate = useNavigate();
    const { getColors } = useTheme();
    const { clearUser } = useUser();
    const colors = getColors();

    const handleLogout = () => {
        localStorage.removeItem("token");
        clearUser();
        // Force reload/navigation to reset state
        window.location.href = "/";
    };

    return (
        <header
            className="sticky top-0 z-50 backdrop-blur-xl shadow-sm transition-colors duration-500"
            style={{
                backgroundColor: `${colors.cardBg}`,
                borderBottom: `1px solid ${colors.border}`,
            }}
        >
            <div className="w-full px-4 py-2">
                <div className="flex items-center justify-between">
                    {/* Logo - Lion -> Clicking leads to Landing/Splash */}
                    <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => navigate("/")}
                        title="Go to Landing Page"
                    >
                        <div>
                            <img
                                src="/lion.png"
                                alt="VETRI DQX Logo"
                                className="h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
                            />
                        </div>
                    </div>

                    {/* Right side controls */}
                    <div className="flex items-center gap-4">
                        <ThemeSelector />



                        {/* Settings Button */}
                        <button
                            onClick={() => navigate("/settings")}
                            className="p-2 rounded-xl transition-all duration-200 hover:scale-105"
                            style={{
                                color: colors.textSecondary,
                                backgroundColor: colors.cardBg,
                                border: `1px solid ${colors.border}`,
                            }}
                            title="Settings"
                        >
                            <Settings className="w-5 h-5" />
                        </button>

                        {/* Profile Button */}
                        <ProfileAvatar
                            size="medium"
                            onClick={() => navigate("/profile")}
                        />

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105"
                            style={{
                                color: colors.textSecondary,
                                backgroundColor: colors.cardBg,
                                border: `1px solid ${colors.border}`,
                            }}
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}

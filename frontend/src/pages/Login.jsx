import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { login } from "../services/api";
import ThemeSelector from "../components/ThemeSelector";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";

export default function Login({ setIsAuthenticated }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { getColors } = useTheme();
    const { setUser } = useUser();
    const colors = getColors();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await login({ email, password });
            localStorage.setItem("token", res.data.access_token);
            // Use the user object from the response which contains the ID
            if (res.data.user) {
                setUser(res.data.user);
            } else {
                // Fallback if user object is missing (shouldn't happen with updated backend)
                setUser({ email, name: email.split("@")[0] });
            }
            setIsAuthenticated(true);
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.detail || "Login failed. Please try again.");
        }
        setLoading(false);
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 transition-colors duration-500"
            style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.primary} 100%)`,
            }}
        >
            {/* Background pattern */}
            <div className="fixed inset-0 opacity-10 pointer-events-none">
                <img src="/logo.jpg" alt="" className="w-full h-full object-cover" />
            </div>

            {/* Theme Toggle - Top Right */}
            <div className="absolute top-6 right-6 z-50">
                <ThemeSelector />
            </div>

            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
                    style={{ backgroundColor: colors.accent1 }}
                />
                <div
                    className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
                    style={{ backgroundColor: colors.accent2, animationDelay: "2s" }}
                />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center">
                    <img src="/logo.jpg" alt="VETRI DQX" className="h-24 object-contain" />
                </div>

                <div className="text-center mb-6">
                    <p style={{ color: colors.textSecondary }}>Sign in to your account</p>
                </div>

                {/* Form Card */}
                <div
                    className="rounded-3xl p-8 shadow-2xl backdrop-blur-xl transition-colors duration-500"
                    style={{
                        backgroundColor: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                    }}
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div
                                className="p-4 rounded-xl text-sm"
                                style={{
                                    backgroundColor: "rgba(239, 68, 68, 0.2)",
                                    border: "1px solid rgba(239, 68, 68, 0.5)",
                                    color: "#fca5a5",
                                }}
                            >
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5"
                                    style={{ color: colors.textSecondary }}
                                />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    className="w-full pl-12 pr-4 py-4 rounded-xl transition-all focus:outline-none focus:ring-2"
                                    style={{
                                        backgroundColor: colors.secondary,
                                        border: `1px solid ${colors.border}`,
                                        color: colors.textPrimary,
                                        focusRingColor: colors.accent1,
                                    }}
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                                Password
                            </label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5"
                                    style={{ color: colors.textSecondary }}
                                />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    className="w-full pl-12 pr-4 py-4 rounded-xl transition-all focus:outline-none focus:ring-2"
                                    style={{
                                        backgroundColor: colors.secondary,
                                        border: `1px solid ${colors.border}`,
                                        color: colors.textPrimary,
                                    }}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-6 rounded-xl text-white font-semibold shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                            style={{
                                background: `linear-gradient(135deg, ${colors.accent1}, ${colors.accent2})`,
                            }}
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p style={{ color: colors.textSecondary }}>
                            Don't have an account?{" "}
                            <Link
                                to="/signup"
                                className="font-medium transition-colors hover:opacity-80"
                                style={{ color: colors.accent1 }}
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

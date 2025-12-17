import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Database, Shield, Zap, FileCheck, Settings, FolderOpen, GitCompare } from "lucide-react";
import ReportCards from "../components/ReportCards";
import QualityChart from "../components/QualityChart";
import ProfileAvatar from "../components/ProfileAvatar";
import ThemeSelector from "../components/ThemeSelector";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import img1 from "../templates/img1.png";
import img2 from "../templates/img2.png";

export default function Dashboard({ setIsAuthenticated }) {
    const [report, setReport] = useState(null);
    const navigate = useNavigate();
    const { getColors, getThemeInfo } = useTheme();
    const { clearUser } = useUser();
    const colors = getColors();
    const themeInfo = getThemeInfo();

    const handleLogout = () => {
        localStorage.removeItem("token");
        clearUser();
        setIsAuthenticated(false);
        navigate("/login");
    };

    return (
        <div
            className="min-h-screen transition-colors duration-500"
            style={{ backgroundColor: colors.primary }}
        >
            {/* Background pattern with logo */}
            {/* Background pattern removed */}

            {/* Header */}



            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.primary} 100%)`,
                    }}
                />
                {/* Hero background image removed */}

                <div className="relative max-w-7xl mx-auto px-6 py-6">
                    <div className="text-center">
                        {/* Hero Logo Banner */}
                        <img
                            src="/logo.jpg"
                            alt="VETRI DQX"
                            className="mx-auto mb-8 w-full max-w-4xl object-contain"
                            style={{
                                filter: "drop-shadow(0 0 20px rgba(0,0,0,0.5))"
                            }}
                        />
                        <p className="text-xl max-w-2xl mx-auto" style={{ color: colors.textSecondary }}>
                            Your Best AI Data Quality Xpert Copilot - Clean, validate, and standardize your B2B datasets
                        </p>

                    </div>

                    {/* Feature Images with Hover Effect */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12 max-w-6xl mx-auto">
                        <div
                            className="relative overflow-hidden cursor-pointer group rounded-3xl"
                            style={{ height: '500px' }}
                        >
                            {/* Image blends into black background */}
                            <img
                                src={img1}
                                alt="Data Cleaning Feature"
                                className="w-full h-full object-contain rounded-3xl transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>
                        <div
                            className="relative overflow-hidden cursor-pointer group rounded-3xl"
                            style={{ height: '500px' }}
                        >
                            <img
                                src={img2}
                                alt="Data Analysis Feature"
                                className="w-full h-full object-contain rounded-3xl transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 -mt-8">
                <div className="flex flex-col gap-12">
                    {/* Action Buttons Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Copilot Button Section */}
                        <div
                            className="rounded-3xl shadow-2xl p-8 transition-colors duration-500 flex flex-col items-center justify-center transform hover:-translate-y-1"
                            style={{
                                backgroundColor: colors.cardBg,
                                border: `1px solid ${colors.border}`,
                            }}
                        >
                            <div className="text-center mb-6">
                                <div
                                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                                    style={{
                                        background: `linear-gradient(135deg, ${colors.accent1}, ${colors.accent2})`,
                                    }}
                                >
                                    <Database className="w-10 h-10 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                                    Data Quality Copilot
                                </h2>
                                <p style={{ color: colors.textSecondary }}>
                                    Upload and analyze your CSV files with AI-powered validation
                                </p>
                            </div>

                            <button
                                onClick={() => navigate('/copilot')}
                                className="w-full py-4 px-8 rounded-xl text-white font-bold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                                style={{
                                    background: `linear-gradient(135deg, ${colors.accent1}, ${colors.accent2})`,
                                }}
                            >
                                Open Copilot →
                            </button>
                        </div>

                        {/* Projects Button Section */}
                        <div
                            className="rounded-3xl shadow-2xl p-8 transition-colors duration-500 flex flex-col items-center justify-center transform hover:-translate-y-1"
                            style={{
                                backgroundColor: colors.cardBg,
                                border: `1px solid ${colors.border}`,
                            }}
                        >
                            <div className="text-center mb-6">
                                <div
                                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                                    style={{
                                        background: `linear-gradient(135deg, ${colors.accent2}, #3b82f6)`,
                                    }}
                                >
                                    <FolderOpen className="w-10 h-10 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                                    My Projects
                                </h2>
                                <p style={{ color: colors.textSecondary }}>
                                    Manage your data cleaning workspaces, runs, and history
                                </p>
                            </div>

                            <button
                                onClick={() => navigate('/projects')}
                                className="w-full py-4 px-8 rounded-xl text-white font-bold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                                style={{
                                    background: `linear-gradient(135deg, ${colors.accent2}, #3b82f6)`,
                                }}
                            >
                                Open Projects →
                            </button>
                        </div>

                        {/* Differential Analysis Button Section */}
                        <div
                            className="rounded-3xl shadow-2xl p-8 transition-colors duration-500 flex flex-col items-center justify-center transform hover:-translate-y-1 md:col-span-2 lg:col-span-1"
                            style={{
                                backgroundColor: colors.cardBg,
                                border: `1px solid ${colors.border}`,
                            }}
                        >
                            <div className="text-center mb-6">
                                <div
                                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                                    style={{
                                        background: `linear-gradient(135deg, #8b5cf6, #d946ef)`, // Purple/Pink gradient
                                    }}
                                >
                                    <GitCompare className="w-10 h-10 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                                    Differential Analysis
                                </h2>
                                <p style={{ color: colors.textSecondary }}>
                                    Compare original vs cleaned data to verify AI corrections
                                </p>
                            </div>

                            <button
                                onClick={() => navigate('/differential-analysis')} // Redirects to projects as context is needed
                                className="w-full py-4 px-8 rounded-xl text-white font-bold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                                style={{
                                    background: `linear-gradient(135deg, #8b5cf6, #d946ef)`,
                                }}
                            >
                                Compare Data →
                            </button>
                        </div>
                    </div>

                    {/* Instructions / How It Works */}
                    <div
                        className="rounded-3xl shadow-2xl p-8 transition-colors duration-500 w-full max-w-4xl mx-auto"
                        style={{
                            backgroundColor: colors.cardBg,
                            border: `1px solid ${colors.border}`,
                        }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div
                                className="p-3 rounded-2xl"
                                style={{
                                    background: `linear-gradient(135deg, ${colors.accent2}, ${colors.accent1})`,
                                }}
                            >
                                <FileCheck className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                                    How It Works
                                </h2>
                                <p className="text-sm" style={{ color: colors.textSecondary }}>
                                    Simple 3-step process
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {[
                                { step: "1", title: "Upload CSV", desc: "Upload your B2B dataset with company and contact information" },
                                { step: "2", title: "AI Processing", desc: "Our AI validates, corrects, and normalizes your data" },
                                { step: "3", title: "Get Results", desc: "Download cleaned data with quality score and detailed report" },
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div
                                        className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                                        style={{
                                            background: `linear-gradient(135deg, ${colors.accent1}, ${colors.accent2})`,
                                        }}
                                    >
                                        {item.step}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold" style={{ color: colors.textPrimary }}>
                                            {item.title}
                                        </h3>
                                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div
                            className="mt-8 p-4 rounded-2xl"
                            style={{
                                backgroundColor: `${colors.accent1}20`,
                                border: `1px solid ${colors.accent1}40`,
                            }}
                        >
                            <p className="text-sm" style={{ color: colors.textPrimary }}>
                                <span style={{ color: colors.accent1, fontWeight: 600 }}>Pro Tip:</span> Use the sample.csv from the backend/data folder to test the system!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                {report && (
                    <div className="mt-8">
                        <ReportCards report={report} />
                        <QualityChart score={report.qa_report.quality_score} />

                        {/* Download Section */}
                        <div
                            className="mt-8 rounded-3xl shadow-2xl p-8 transition-colors duration-500"
                            style={{
                                backgroundColor: colors.cardBg,
                                border: `1px solid ${colors.border}`,
                            }}
                        >
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <h3 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                                        Cleaned Dataset Ready!
                                    </h3>
                                    <p style={{ color: colors.textSecondary }}>
                                        Your data has been processed and cleaned
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                                        Output Location
                                    </p>
                                    <p
                                        className="font-mono text-sm px-3 py-1 rounded-lg"
                                        style={{
                                            backgroundColor: colors.secondary,
                                            color: colors.textPrimary,
                                        }}
                                    >
                                        {report.cleaned_file_path}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer
                className="mt-12 transition-colors duration-500"
                style={{
                    backgroundColor: colors.secondary,
                    borderTop: `1px solid ${colors.border}`,
                }}
            >
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-3">
                            {/* Images removed */}
                        </div>
                        <p className="text-sm text-center" style={{ color: colors.textSecondary }}>
                            © 2024 VETRI DQX - Your Best AI Data Quality Xpert Copilot
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

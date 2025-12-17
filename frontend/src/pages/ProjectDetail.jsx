import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Upload,
    Clock,
    FileText,
    BarChart3,
    TrendingUp,
    TrendingDown,
    Minus,
    RefreshCw,
    Download,
    CheckCircle,
    AlertCircle,
    GitCompare,
    Calendar,
    ChevronRight,
    Settings,
    Plus,
    Eye,
    Zap,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import {
    getProject,
    getProjectRuns,
    getProjectTimeline,
    uploadToProject,
    compareRuns,
} from "../services/api";
import ThemeSelector from "../components/ThemeSelector";
import QualityScoreTimeline from "../components/QualityScoreTimeline";

// Status Badge Component
const StatusBadge = ({ status, colors }) => {
    const statusConfig = {
        completed: { bg: "#10b98120", text: "#10b981", label: "Completed" },
        pending_review: { bg: "#f5920520", text: "#f59205", label: "Pending Review" },
        processing: { bg: "#3b82f620", text: "#3b82f6", label: "Processing" },
        failed: { bg: "#ef444420", text: "#ef4444", label: "Failed" },
    };

    const config = statusConfig[status] || statusConfig.completed;

    return (
        <span
            className="text-xs px-2 py-1 rounded-full font-medium"
            style={{ backgroundColor: config.bg, color: config.text }}
        >
            {config.label}
        </span>
    );
};

// Quality Trend Icon
const TrendIcon = ({ trend, colors }) => {
    if (trend === "improving") {
        return <TrendingUp className="w-5 h-5" style={{ color: "#10b981" }} />;
    } else if (trend === "declining") {
        return <TrendingDown className="w-5 h-5" style={{ color: "#ef4444" }} />;
    }
    return <Minus className="w-5 h-5" style={{ color: colors.textSecondary }} />;
};



// Comparison Modal
const ComparisonModal = ({ isOpen, onClose, runs, projectId, colors }) => {
    const [run1, setRun1] = useState("");
    const [run2, setRun2] = useState("");
    const [comparing, setComparing] = useState(false);
    const [result, setResult] = useState(null);

    const handleCompare = async () => {
        if (!run1 || !run2 || run1 === run2) return;

        setComparing(true);
        try {
            const response = await compareRuns(projectId, parseInt(run1), parseInt(run2));
            setResult(response.data);
        } catch (err) {
            console.error("Comparison failed:", err);
            alert("Failed to compare runs");
        }
        setComparing(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div
                className="w-full max-w-2xl mx-4 my-8 p-6 rounded-3xl shadow-2xl"
                style={{
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                }}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                        Compare Runs
                    </h2>
                    <button
                        onClick={() => {
                            onClose();
                            setResult(null);
                        }}
                        className="text-2xl"
                        style={{ color: colors.textSecondary }}
                    >
                        ×
                    </button>
                </div>

                {/* Run Selection */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                            Run 1 (Baseline)
                        </label>
                        <select
                            value={run1}
                            onChange={(e) => setRun1(e.target.value)}
                            className="w-full p-3 rounded-xl"
                            style={{
                                backgroundColor: colors.secondary,
                                border: `1px solid ${colors.border}`,
                                color: colors.textPrimary,
                            }}
                        >
                            <option value="">Select a run...</option>
                            {runs.map((r) => (
                                <option key={r.id} value={r.id}>
                                    Run #{r.run_number} - {r.file_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                            Run 2 (Compare To)
                        </label>
                        <select
                            value={run2}
                            onChange={(e) => setRun2(e.target.value)}
                            className="w-full p-3 rounded-xl"
                            style={{
                                backgroundColor: colors.secondary,
                                border: `1px solid ${colors.border}`,
                                color: colors.textPrimary,
                            }}
                        >
                            <option value="">Select a run...</option>
                            {runs.map((r) => (
                                <option key={r.id} value={r.id}>
                                    Run #{r.run_number} - {r.file_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    onClick={handleCompare}
                    disabled={!run1 || !run2 || run1 === run2 || comparing}
                    className="w-full py-3 rounded-xl font-medium text-white transition-all disabled:opacity-50"
                    style={{
                        background: `linear-gradient(135deg, ${colors.accent1}, ${colors.accent2})`,
                    }}
                >
                    {comparing ? (
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                        "Compare Runs"
                    )}
                </button>

                {/* Comparison Results */}
                {result && (
                    <div className="mt-6 space-y-4">
                        <div
                            className="p-4 rounded-xl"
                            style={{
                                backgroundColor: result.summary.includes("improvement")
                                    ? "#10b98120"
                                    : result.summary.includes("regression")
                                        ? "#ef444420"
                                        : "#f5920520",
                                border: `1px solid ${colors.border}`,
                            }}
                        >
                            <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                                {result.summary}
                            </p>
                        </div>

                        <div className="space-y-2">
                            {result.metrics.map((metric, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 rounded-xl"
                                    style={{ backgroundColor: colors.secondary }}
                                >
                                    <span className="font-medium" style={{ color: colors.textPrimary }}>
                                        {metric.metric_name}
                                    </span>
                                    <div className="flex items-center gap-4">
                                        <span style={{ color: colors.textSecondary }}>
                                            {metric.run_1_value}
                                        </span>
                                        <ChevronRight className="w-4 h-4" style={{ color: colors.textSecondary }} />
                                        <span
                                            className="font-bold"
                                            style={{
                                                color: metric.improvement ? "#10b981" : "#ef4444",
                                            }}
                                        >
                                            {metric.run_2_value}
                                        </span>
                                        <span
                                            className="text-xs px-2 py-1 rounded"
                                            style={{
                                                backgroundColor: metric.improvement ? "#10b98120" : "#ef444420",
                                                color: metric.improvement ? "#10b981" : "#ef4444",
                                            }}
                                        >
                                            {metric.difference > 0 ? "+" : ""}
                                            {metric.difference}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function ProjectDetail() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { getColors } = useTheme();
    const { user } = useUser();
    const colors = getColors();

    const [project, setProject] = useState(null);
    const [runs, setRuns] = useState([]);
    const [timeline, setTimeline] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showCompareModal, setShowCompareModal] = useState(false);
    const [uploadMode, setUploadMode] = useState("auto");

    useEffect(() => {
        loadProjectData();
    }, [projectId]);

    const loadProjectData = async () => {
        try {
            setLoading(true);
            const [projectRes, runsRes, timelineRes] = await Promise.all([
                getProject(projectId),
                getProjectRuns(projectId),
                getProjectTimeline(projectId),
            ]);
            setProject(projectRes.data);
            setRuns(runsRes.data.runs || []);
            setTimeline(timelineRes.data);
        } catch (err) {
            console.error("Failed to load project:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const response = await uploadToProject(
                projectId,
                file,
                uploadMode,
                user?.email
            );

            if (uploadMode === "review" && response.data.session_id) {
                navigate(`/review?session=${response.data.session_id}`);
            } else {
                loadProjectData();
            }
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Upload failed. Please try again.");
        }
        setUploading(false);
        e.target.value = "";
    };

    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: colors.primary }}
            >
                <RefreshCw className="w-10 h-10 animate-spin" style={{ color: colors.accent1 }} />
            </div>
        );
    }

    if (!project) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: colors.primary }}
            >
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: "#ef4444" }} />
                    <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                        Project Not Found
                    </h2>
                    <button
                        onClick={() => navigate("/projects")}
                        className="mt-4 px-6 py-2 rounded-xl text-white"
                        style={{ background: `linear-gradient(135deg, ${colors.accent1}, ${colors.accent2})` }}
                    >
                        Back to Projects
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen transition-colors duration-500"
            style={{ backgroundColor: colors.primary }}
        >
            {/* Background pattern */}
            <div className="fixed inset-0 opacity-5 pointer-events-none">
                <img src="/logo.jpg" alt="" className="w-full h-full object-cover" />
            </div>

            <div className="absolute top-6 right-6 z-50">
                <ThemeSelector />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/projects")}
                            className="p-2 rounded-xl transition-all hover:scale-105"
                            style={{
                                backgroundColor: colors.cardBg,
                                border: `1px solid ${colors.border}`,
                            }}
                        >
                            <ArrowLeft className="w-5 h-5" style={{ color: colors.textSecondary }} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
                                {project.name}
                            </h1>
                            {project.description && (
                                <p style={{ color: colors.textSecondary }}>{project.description}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {runs.length >= 2 && (
                            <button
                                onClick={() => setShowCompareModal(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all"
                                style={{
                                    backgroundColor: colors.cardBg,
                                    border: `1px solid ${colors.border}`,
                                    color: colors.textPrimary,
                                }}
                            >
                                <GitCompare className="w-4 h-4" />
                                Compare Runs
                            </button>
                        )}
                        <button
                            onClick={() => navigate(`/projects/${projectId}/settings`)}
                            className="p-2 rounded-xl transition-all"
                            style={{
                                backgroundColor: colors.cardBg,
                                border: `1px solid ${colors.border}`,
                            }}
                        >
                            <Settings className="w-5 h-5" style={{ color: colors.textSecondary }} />
                        </button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        {
                            label: "Total Runs",
                            value: runs.length,
                            icon: FileText,
                            color: colors.accent1,
                        },
                        {
                            label: "Avg Quality",
                            value: timeline?.average_quality_score?.toFixed(1) + "%" || "N/A",
                            icon: BarChart3,
                            color: colors.accent2,
                        },
                        {
                            label: "Trend",
                            value: timeline?.quality_trend || "N/A",
                            icon: () => <TrendIcon trend={timeline?.quality_trend} colors={colors} />,
                            color: timeline?.quality_trend === "improving" ? "#10b981" :
                                timeline?.quality_trend === "declining" ? "#ef4444" : colors.textSecondary,
                        },
                        {
                            label: "Last Updated",
                            value: new Date(project.updated_at).toLocaleDateString(),
                            icon: Calendar,
                            color: colors.textSecondary,
                        },
                    ].map((stat, idx) => (
                        <div
                            key={idx}
                            className="p-4 rounded-2xl"
                            style={{
                                backgroundColor: colors.cardBg,
                                border: `1px solid ${colors.border}`,
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="p-2 rounded-xl"
                                    style={{ backgroundColor: `${stat.color}20` }}
                                >
                                    {typeof stat.icon === "function" ? (
                                        <stat.icon />
                                    ) : (
                                        <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                                    )}
                                </div>
                                <div>
                                    <p className="text-lg font-bold capitalize" style={{ color: colors.textPrimary }}>
                                        {stat.value}
                                    </p>
                                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                                        {stat.label}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Timeline Chart */}
                {runs.length > 0 && (
                    <div
                        className="rounded-2xl p-6 mb-8"
                        style={{
                            backgroundColor: colors.cardBg,
                            border: `1px solid ${colors.border}`,
                        }}
                    >
                        <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
                            Quality Score Timeline
                        </h2>
                        <QualityScoreTimeline dataPoints={timeline?.data_points || []} colors={colors} />
                    </div>
                )}

                {/* Upload Section */}
                <div
                    className="rounded-2xl p-6 mb-8"
                    style={{
                        backgroundColor: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                    }}
                >
                    <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
                        New Run
                    </h2>

                    {/* Mode Toggle */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setUploadMode("auto")}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${uploadMode === "auto" ? "ring-2" : ""
                                }`}
                            style={{
                                backgroundColor: uploadMode === "auto" ? `${colors.accent1}20` : colors.secondary,
                                color: uploadMode === "auto" ? colors.accent1 : colors.textSecondary,
                                border: `1px solid ${uploadMode === "auto" ? colors.accent1 : colors.border}`,
                            }}
                        >
                            <Zap className="w-4 h-4" />
                            Quick Clean
                        </button>
                        <button
                            onClick={() => setUploadMode("review")}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${uploadMode === "review" ? "ring-2" : ""
                                }`}
                            style={{
                                backgroundColor: uploadMode === "review" ? `${colors.accent2}20` : colors.secondary,
                                color: uploadMode === "review" ? colors.accent2 : colors.textSecondary,
                                border: `1px solid ${uploadMode === "review" ? colors.accent2 : colors.border}`,
                            }}
                        >
                            <Eye className="w-4 h-4" />
                            Review Mode
                        </button>
                    </div>

                    <label
                        className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-solid"
                        style={{
                            borderColor: colors.border,
                            backgroundColor: colors.secondary,
                        }}
                    >
                        {uploading ? (
                            <>
                                <RefreshCw
                                    className="w-10 h-10 mb-3 animate-spin"
                                    style={{ color: colors.accent1 }}
                                />
                                <span style={{ color: colors.textSecondary }}>Processing...</span>
                            </>
                        ) : (
                            <>
                                <Upload className="w-10 h-10 mb-3" style={{ color: colors.textSecondary }} />
                                <span className="font-medium" style={{ color: colors.textPrimary }}>
                                    Click to upload CSV
                                </span>
                                <span className="text-sm" style={{ color: colors.textSecondary }}>
                                    or drag and drop
                                </span>
                            </>
                        )}
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                    </label>
                </div>

                {/* Run History */}
                <div
                    className="rounded-2xl p-6"
                    style={{
                        backgroundColor: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                    }}
                >
                    <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
                        Run History
                    </h2>

                    {runs.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textSecondary }} />
                            <p style={{ color: colors.textSecondary }}>
                                No runs yet. Upload a file to create your first run.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {runs.map((run) => (
                                <div
                                    key={run.id}
                                    className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all hover:shadow-md"
                                    style={{ backgroundColor: colors.secondary }}
                                    onClick={() => navigate(`/projects/${projectId}/runs/${run.id}`)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                                            style={{
                                                backgroundColor: `${colors.accent1}20`,
                                                color: colors.accent1,
                                            }}
                                        >
                                            #{run.run_number}
                                        </div>
                                        <div>
                                            <p className="font-medium" style={{ color: colors.textPrimary }}>
                                                {run.file_name}
                                            </p>
                                            <div className="flex items-center gap-3 text-xs" style={{ color: colors.textSecondary }}>
                                                <span>{run.row_count} rows</span>
                                                <span>•</span>
                                                <span>{run.total_issues} issues</span>
                                                <span>•</span>
                                                <span>{run.total_fixes} fixes</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p
                                                className="text-lg font-bold"
                                                style={{
                                                    color:
                                                        run.quality_score_after >= 90
                                                            ? "#10b981"
                                                            : run.quality_score_after >= 70
                                                                ? "#f59205"
                                                                : "#ef4444",
                                                }}
                                            >
                                                {run.quality_score_after?.toFixed(1)}%
                                            </p>
                                            <p className="text-xs" style={{ color: colors.textSecondary }}>
                                                {new Date(run.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <StatusBadge status={run.status} colors={colors} />
                                        <ChevronRight className="w-5 h-5" style={{ color: colors.textSecondary }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Comparison Modal */}
            <ComparisonModal
                isOpen={showCompareModal}
                onClose={() => setShowCompareModal(false)}
                runs={runs}
                projectId={projectId}
                colors={colors}
            />
        </div>
    );
}

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import UnifiedFilterButton from "../components/UnifiedFilterButton";
import {
    ArrowLeft,
    Download,
    Trash2,
    CheckCircle,
    AlertCircle,
    FileText,
    Clock,
    RefreshCw,
    Shield,
    Smartphone,
    Mail,
    Globe,
    Briefcase,
    Save,
    GitCompare
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import { getRun, deleteRun, updateRunNotes } from "../services/api";
import ThemeSelector from "../components/ThemeSelector";

export default function RunDetail() {
    const { projectId, runId } = useParams();
    const navigate = useNavigate();
    const { getColors } = useTheme();
    const colors = getColors();

    const [run, setRun] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState("");
    const [savingNotes, setSavingNotes] = useState(false);

    useEffect(() => {
        loadRun();
    }, [projectId, runId]);

    const loadRun = async () => {
        try {
            setLoading(true);
            const response = await getRun(projectId, runId);
            setRun(response.data);
            setNotes(response.data.notes || "");
        } catch (err) {
            console.error("Failed to load run:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this run?")) return;

        try {
            await deleteRun(projectId, runId);
            navigate(`/projects/${projectId}`);
        } catch (err) {
            console.error("Failed to delete run:", err);
            alert("Failed to delete run. Please try again.");
        }
    };

    const handleSaveNotes = async () => {
        try {
            setSavingNotes(true);
            await updateRunNotes(projectId, runId, notes);
            alert("Notes updated successfully");
        } catch (err) {
            console.error("Failed to update notes:", err);
            alert("Failed to save notes");
        } finally {
            setSavingNotes(false);
        }
    };

    const handleDownload = (path, filename) => {
        // In a real app, you would generate a secure pre-signed URL or hit a download endpoint
        // For local dev, we might assume the backend serves these or we can mock it
        alert(`Download feature placeholder for: ${filename}`);
        // window.open(`${API_BASE_URL}/files/download?path=${path}`, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                <RefreshCw className="w-10 h-10 animate-spin" style={{ color: colors.accent1 }} />
            </div>
        );
    }

    if (!run) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: "#ef4444" }} />
                    <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>Run Not Found</h2>
                    <button
                        onClick={() => navigate(`/projects/${projectId}`)}
                        className="mt-4 px-6 py-2 rounded-xl text-white"
                        style={{ background: `linear-gradient(135deg, ${colors.accent1}, ${colors.accent2})` }}
                    >
                        Back to Project
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen transition-colors duration-500" style={{ backgroundColor: colors.primary }}>
            {/* Background pattern */}
            <div className="fixed inset-0 opacity-5 pointer-events-none">
                <img src="/logo.jpg" alt="" className="w-full h-full object-cover" />
            </div>

            <div className="absolute top-6 right-6 z-50">
                <ThemeSelector />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(`/projects/${projectId}`)}
                            className="p-2 rounded-xl transition-all hover:scale-105"
                            style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}
                        >
                            <ArrowLeft className="w-5 h-5" style={{ color: colors.textSecondary }} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
                                    Run #{run.run_number}
                                </h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${run.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                                    }`}>
                                    {run.status.toUpperCase()}
                                </span>
                            </div>
                            <p style={{ color: colors.textSecondary }}>{run.file_name}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <UnifiedFilterButton />

                        <button
                            onClick={() => navigate(`/review?session=${run.id}`)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium hover:opacity-90 transition-all"
                            style={{ background: `linear-gradient(135deg, ${colors.secondary}, ${colors.cardBg})`, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                        >
                            <Shield className="w-4 h-4" />
                            Open Inspector
                        </button>

                        <button
                            onClick={() => window.open(`http://localhost:8000/api/projects/${projectId}/runs/${runId}/download?type=cleaned`, '_blank')}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium hover:opacity-90 transition-all"
                            style={{ background: `linear-gradient(135deg, ${colors.accent1}, ${colors.accent2})` }}
                        >
                            <Download className="w-4 h-4" />
                            Download Cleaned
                        </button>
                        <button
                            onClick={() => navigate(`/projects/${projectId}/runs/${runId}/job-summary`)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium hover:opacity-90 transition-all"
                            style={{ background: `linear-gradient(135deg, ${colors.accent2}, ${colors.primary})` }}
                        >
                            <Briefcase className="w-4 h-4" />
                            Job Analysis
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-3 rounded-xl hover:bg-red-50 transition-all"
                            style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, color: "#ef4444" }}
                            title="Delete Run"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Stats */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Quality Score Card */}
                        <div className="p-6 rounded-2xl" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                            <h2 className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>Quality Score</h2>
                            <div className="flex items-center gap-6">
                                <div className="text-5xl font-bold" style={{ color: run.quality_score_after >= 80 ? '#10b981' : run.quality_score_after >= 60 ? '#f59205' : '#ef4444' }}>
                                    {run.quality_score_after.toFixed(1)}%
                                </div>
                                <div className="h-12 w-px bg-gray-200"></div>
                                <div className="space-y-1">
                                    <div className="text-sm" style={{ color: colors.textSecondary }}>Initial Score (Estimated)</div>
                                    <div className="font-semibold" style={{ color: colors.textPrimary }}>{run.quality_score_before?.toFixed(1) || '0.0'}%</div>
                                </div>
                            </div>
                        </div>

                        {/* Issue Breakdown */}
                        <div className="p-6 rounded-2xl" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                            <h2 className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>Issue Breakdown</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-xl bg-red-50">
                                    <Mail className="w-5 h-5 text-red-500 mb-2" />
                                    <div className="text-2xl font-bold text-red-700">{run.issue_breakdown?.invalid_emails || 0}</div>
                                    <div className="text-xs text-red-600">Invalid Emails</div>
                                </div>
                                <div className="p-4 rounded-xl bg-orange-50">
                                    <Smartphone className="w-5 h-5 text-orange-500 mb-2" />
                                    <div className="text-2xl font-bold text-orange-700">{run.issue_breakdown?.invalid_phones || 0}</div>
                                    <div className="text-xs text-orange-600">Invalid Phones</div>
                                </div>
                                <div className="p-4 rounded-xl bg-blue-50">
                                    <Globe className="w-5 h-5 text-blue-500 mb-2" />
                                    <div className="text-2xl font-bold text-blue-700">{run.issue_breakdown?.domain_fixes || 0}</div>
                                    <div className="text-xs text-blue-600">Domain Fixes</div>
                                </div>
                                <div className="p-4 rounded-xl bg-purple-50">
                                    <Briefcase className="w-5 h-5 text-purple-500 mb-2" />
                                    <div className="text-2xl font-bold text-purple-700">{run.issue_breakdown?.job_title_fixes || 0}</div>
                                    <div className="text-xs text-purple-600">Job Title Fixes</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Meta & Notes */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                            <h2 className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>Run Details</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2" style={{ color: colors.textSecondary }}>
                                        <FileText className="w-4 h-4" />
                                        <span className="text-sm">Row Count</span>
                                    </div>
                                    <span className="font-medium" style={{ color: colors.textPrimary }}>{run.row_count}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2" style={{ color: colors.textSecondary }}>
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm">Processed At</span>
                                    </div>
                                    <span className="font-medium" style={{ color: colors.textPrimary }}>{new Date(run.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2" style={{ color: colors.textSecondary }}>
                                        <Shield className="w-4 h-4" />
                                        <span className="text-sm">Mode</span>
                                    </div>
                                    <span className="font-medium capitalize" style={{ color: colors.textPrimary }}>{run.mode}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                            <h2 className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>Notes</h2>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add notes about this run..."
                                rows={4}
                                className="w-full p-3 rounded-xl mb-3 text-sm"
                                style={{ backgroundColor: colors.secondary, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                            />
                            <button
                                onClick={handleSaveNotes}
                                disabled={savingNotes}
                                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-opacity-90"
                                style={{ backgroundColor: colors.accent1, color: 'white' }}
                            >
                                <Save className="w-4 h-4" />
                                {savingNotes ? 'Saving...' : 'Save Notes'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

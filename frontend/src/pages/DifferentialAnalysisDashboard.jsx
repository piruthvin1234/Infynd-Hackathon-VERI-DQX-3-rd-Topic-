import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GitCompare, UploadCloud, Clock, FileText, ChevronRight, Search, ArrowLeft } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import { getProjects, getProjectRuns, uploadToProject, createProject } from "../services/api";

export default function DifferentialAnalysisDashboard() {
    const navigate = useNavigate();
    const { getColors } = useTheme();
    const colors = getColors();

    const [recentRuns, setRecentRuns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const userStr = localStorage.getItem("user");
            const parsedUser = userStr ? JSON.parse(userStr) : null;
            const userId = parsedUser?.id || 1;

            // 1. Get Projects
            const projectsRes = await getProjects(userId);
            // Fix: API returns { projects: [...], total: ... }
            const allProjects = projectsRes.data.projects || [];
            setProjects(allProjects);

            // 2. Get Runs for each project (limit to recent)
            let allRuns = [];
            for (const project of allProjects) {
                try {
                    const runsRes = await getProjectRuns(project.id, 0, 5); // Get top 5 per project
                    // Fix: API returns { runs: [...], total: ... }
                    const runs = (runsRes.data.runs || []).map(r => ({
                        ...r,
                        project_name: project.name,
                        project_id: project.id
                    }));
                    allRuns = [...allRuns, ...runs];
                } catch (e) {
                    console.error(`Failed to load runs for project ${project.id}`, e);
                }
            }

            // 3. Sort by Date Descending
            allRuns.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setRecentRuns(allRuns);

        } catch (err) {
            console.error("Failed to load history:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setUploading(true);

            // Find or Create a default project for "Quick Analysis"
            let targetProjectId;
            if (projects.length > 0) {
                targetProjectId = projects[0].id; // Use first available for now
            } else {
                // Create one
                const userStr = localStorage.getItem("user");
                const parsedUser = userStr ? JSON.parse(userStr) : null;
                const userId = parsedUser?.id || 1;

                const newProj = await createProject({ name: "Quick Analysis Workspace", description: "Auto-created for differential analysis" }, userId);
                targetProjectId = newProj.data.id;
            }

            // Upload
            const response = await uploadToProject(targetProjectId, file);
            // Fix: Response is { run: {...}, report: {...} }
            const runId = response.data.run.id;

            // Navigate to Diff View
            navigate(`/projects/${targetProjectId}/runs/${runId}/diff`, { state: { from: 'diff-dashboard' } });

        } catch (err) {
            console.error("Upload failed:", err);
            alert("Analysis failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen transition-colors duration-500" style={{ backgroundColor: colors.primary }}>
            {/* Background Pattern */}
            <div className="fixed inset-0 opacity-5 pointer-events-none">
                <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(${colors.textSecondary} 1px, transparent 1px)`, backgroundSize: '30px 30px' }}></div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
                    <div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 mb-6 text-sm font-medium transition-colors hover:text-purple-500"
                            style={{ color: colors.textSecondary }}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </button>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/20">
                                <GitCompare className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-4xl font-bold" style={{ color: colors.textPrimary }}>
                                Differential Analysis
                            </h1>
                        </div>
                        <p className="text-lg" style={{ color: colors.textSecondary }}>
                            Upload raw data to compare with AI-cleaned versions instantly.
                        </p>
                    </div>
                </div>

                {/* Main Action - Upload Area */}
                <div
                    className="relative overflow-hidden rounded-3xl p-1 mb-12 transition-all hover:scale-[1.01]"
                    style={{ background: `linear-gradient(135deg, ${colors.accent1}, ${colors.accent2})` }}
                >
                    <div
                        className="relative rounded-[22px] p-10 text-center cursor-pointer transition-colors"
                        style={{ backgroundColor: colors.cardBg }}
                    >
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            disabled={uploading}
                        />

                        <div className="relative z-10 flex flex-col items-center gap-4">
                            {uploading ? (
                                <>
                                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4" style={{ borderColor: colors.accent1 }}></div>
                                    <h3 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>Analyzing Differences...</h3>
                                    <p style={{ color: colors.textSecondary }}>Using AI to clean and compare your dataset</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                                        <UploadCloud className="w-10 h-10" style={{ color: colors.accent1 }} />
                                    </div>
                                    <h2 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
                                        Start New Analysis
                                    </h2>
                                    <p className="text-lg max-w-lg mx-auto" style={{ color: colors.textSecondary }}>
                                        Drag & drop your CSV file here or click to browse. We'll clean it and highlight every single change.
                                    </p>
                                    <button
                                        className="mt-4 px-6 py-2 rounded-full font-semibold pointer-events-none"
                                        style={{ backgroundColor: `${colors.accent1}15`, color: colors.accent1 }}
                                    >
                                        Supports .csv files
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent History */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: colors.textPrimary }}>
                            <Clock className="w-6 h-6" style={{ color: colors.textSecondary }} />
                            Recent Analyses
                        </h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search history..."
                                className="pl-10 pr-4 py-2 rounded-xl text-sm border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
                                style={{ backgroundColor: colors.cardBg, color: colors.textPrimary }}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-pulse flex flex-col items-center gap-4">
                                <div className="h-4 w-48 bg-gray-200 rounded"></div>
                                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    ) : recentRuns.length === 0 ? (
                        <div className="text-center py-12 rounded-3xl border-2 border-dashed" style={{ borderColor: colors.border }}>
                            <p style={{ color: colors.textSecondary }}>No analysis history found. Upload a file to get started!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {recentRuns.map((run) => (
                                <div
                                    key={run.id}
                                    onClick={() => navigate(`/projects/${run.project_id}/runs/${run.id}/diff`, { state: { from: 'diff-dashboard' } })}
                                    className="group relative p-6 rounded-2xl transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                                    style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="p-4 rounded-xl font-bold text-lg" style={{ backgroundColor: `${colors.secondary}` }}>
                                            <FileText className="w-6 h-6" style={{ color: colors.textPrimary }} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold mb-1" style={{ color: colors.textPrimary }}>
                                                {run.file_name}
                                            </h3>
                                            <div className="flex items-center gap-3 text-sm" style={{ color: colors.textSecondary }}>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(run.created_at).toLocaleDateString()}
                                                </span>
                                                <span>•</span>
                                                <span>{run.project_name}</span>
                                                <span>•</span>
                                                <span className={`font-medium ${run.quality_score_after > 80 ? 'text-green-500' : 'text-orange-500'}`}>
                                                    Quality: {run.quality_score_after?.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
                                        {/* Stat Pills */}
                                        <div className="flex gap-2">
                                            <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-600">
                                                {run.issue_breakdown?.invalid_emails + run.issue_breakdown?.invalid_phones || 0} Issues
                                            </span>
                                            <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-green-50 text-green-600">
                                                {run.row_count} Rows
                                            </span>
                                        </div>

                                        <button
                                            className="ml-auto p-2 rounded-full hover:bg-gray-100 transition-colors"
                                            style={{ color: colors.textSecondary }}
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

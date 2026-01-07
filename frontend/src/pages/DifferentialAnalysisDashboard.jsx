import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    GitCompare, UploadCloud, Clock, FileText, ChevronRight,
    Search, ArrowLeft, Cpu, Activity, Shield
} from "lucide-react";
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

            const projectsRes = await getProjects(userId);
            const allProjects = projectsRes.data.projects || [];
            setProjects(allProjects);

            let allRuns = [];
            for (const project of allProjects) {
                try {
                    const runsRes = await getProjectRuns(project.id, 0, 5);
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
            let targetProjectId;
            if (projects.length > 0) {
                targetProjectId = projects[0].id;
            } else {
                const userStr = localStorage.getItem("user");
                const parsedUser = userStr ? JSON.parse(userStr) : null;
                const userId = parsedUser?.id || 1;
                const newProj = await createProject({ name: "Quick Analysis Workspace", description: "Auto-created for differential analysis" }, userId);
                targetProjectId = newProj.data.id;
            }

            const response = await uploadToProject(targetProjectId, file);
            const runId = response.data.run.id;
            navigate(`/projects/${targetProjectId}/runs/${runId}/diff`, { state: { from: 'diff-dashboard' } });

        } catch (err) {
            console.error("Upload failed:", err);
            alert("Analysis failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030304] text-slate-200 font-sans">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=JetBrains+Mono:wght@400;500&display=swap');
                
                .font-tech { font-family: 'Orbitron', sans-serif !important; }
                .font-mono { font-family: 'JetBrains Mono', monospace !important; }
                
                .tech-grid {
                    background-image: 
                        linear-gradient(rgba(0, 243, 255, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 243, 255, 0.03) 1px, transparent 1px);
                    background-size: 40px 40px;
                }

                .tech-panel {
                    background: rgba(10, 10, 15, 0.8);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
                }

                .glow-border:hover {
                    border-color: rgba(0, 243, 255, 0.4);
                    box-shadow: 0 0 20px rgba(0, 243, 255, 0.1);
                }

                .text-glow-blue { text-shadow: 0 0 10px rgba(0, 243, 255, 0.5); }
            `}</style>

            <div className="tech-grid fixed inset-0 pointer-events-none"></div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
                    <div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 mb-6 text-xs font-tech font-bold uppercase tracking-widest text-slate-500 hover:text-[#00f3ff] transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Return to Command Center
                        </button>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-4 rounded-xl bg-[#00f3ff]/10 border border-[#00f3ff]/50 shadow-[0_0_15px_rgba(0,243,255,0.2)]">
                                <GitCompare className="w-8 h-8 text-[#00f3ff]" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-tech font-bold text-white tracking-widest text-glow-blue">
                                    DIFFERENTIAL <span className="text-[#00f3ff]">ANALYSIS</span>
                                </h1>
                                <p className="text-sm font-tech text-slate-500 uppercase tracking-widest mt-1">
                                    Neural Data Alignment & Discrepancy Matrix
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upload Area */}
                <div
                    className="relative overflow-hidden rounded-3xl p-[1px] mb-12 transition-all hover:scale-[1.01]"
                    style={{ background: 'linear-gradient(135deg, #00f3ff, #bc13fe)' }}
                >
                    <div
                        className="relative rounded-[23px] p-12 text-center cursor-pointer transition-colors bg-[#0a0a0f]/90"
                    >
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            disabled={uploading}
                        />

                        <div className="relative z-10 flex flex-col items-center gap-6">
                            {uploading ? (
                                <>
                                    <div className="w-20 h-20 border-4 border-[#00f3ff]/20 border-t-[#00f3ff] rounded-full animate-spin shadow-[0_0_20px_rgba(0,243,255,0.3)]"></div>
                                    <h3 className="text-2xl font-tech font-bold text-white tracking-[0.2em] uppercase">Processing Matrix...</h3>
                                    <p className="text-slate-500 font-tech text-xs uppercase tracking-widest">Injecting AI cleanup protocols</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-24 h-24 rounded-full bg-[#00f3ff]/5 flex items-center justify-center mb-2 border border-[#00f3ff]/20">
                                        <UploadCloud className="w-12 h-12 text-[#00f3ff]" />
                                    </div>
                                    <h2 className="text-3xl font-tech font-bold text-white tracking-[0.1em] uppercase">
                                        Initialize New Analysis
                                    </h2>
                                    <p className="text-slate-400 font-tech text-xs uppercase tracking-[0.2em] max-w-xl mx-auto leading-relaxed">
                                        Drop your raw CSV datasets here. Our AI core will perform high-precision normalization and map every state deviation.
                                    </p>
                                    <div className="mt-4 px-8 py-2 rounded-full font-tech text-[10px] font-bold tracking-[0.3em] uppercase border border-white/10 bg-white/5 text-slate-400">
                                        Protocol Support: .CSV MATRIX
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent History */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-tech font-bold flex items-center gap-4 text-white tracking-[0.2em] uppercase">
                            <Activity className="w-6 h-6 text-[#bc13fe]" />
                            Analysis Logs
                        </h2>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#00f3ff] transition-colors" />
                            <input
                                type="text"
                                placeholder="SEARCH LOGS..."
                                className="pl-10 pr-4 py-2 rounded-xl text-[10px] font-tech font-bold border border-white/10 focus:border-[#00f3ff]/50 bg-black/40 text-white outline-none w-64 tracking-widest placeholder:text-slate-600 transition-all focus:shadow-[0_0_15px_rgba(0,243,255,0.1)]"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-pulse flex flex-col items-center gap-6">
                                <div className="h-4 w-48 bg-white/5 rounded-full"></div>
                                <div className="h-4 w-32 bg-white/5 rounded-full"></div>
                            </div>
                        </div>
                    ) : recentRuns.length === 0 ? (
                        <div className="text-center py-20 rounded-3xl border border-dashed border-white/10 tech-panel">
                            <p className="font-tech text-slate-500 uppercase tracking-widest text-xs">No Matrix History Found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {recentRuns.map((run) => (
                                <div
                                    key={run.id}
                                    onClick={() => navigate(`/projects/${run.project_id}/runs/${run.id}/diff`, { state: { from: 'diff-dashboard' } })}
                                    className="group relative p-6 rounded-2xl transition-all hover:bg-white/[0.04] tech-panel cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-6 glow-border"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 group-hover:border-[#00f3ff]/50 transition-all">
                                            <FileText className="w-6 h-6 text-slate-400 group-hover:text-[#00f3ff]" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-tech font-bold text-white tracking-widest mb-2 group-hover:text-[#00f3ff] transition-colors">
                                                {run.file_name}
                                            </h3>
                                            <div className="flex items-center gap-4 text-[10px] font-tech font-bold tracking-[0.2em] text-slate-500 uppercase">
                                                <span className="flex items-center gap-2">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(run.created_at).toLocaleDateString()}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                <span>{run.project_name}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                <span className={`${run.quality_score_after > 80 ? 'text-[#0aff60]' : 'text-[#facc15]'}`}>
                                                    INTEGRITY: {run.quality_score_after?.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div className="flex gap-2">
                                            <span className="px-3 py-1.5 rounded-lg text-[9px] font-tech font-bold tracking-widest bg-[#ff003c]/10 text-[#ff003c] border border-[#ff003c]/20">
                                                {run.issue_breakdown?.invalid_emails + run.issue_breakdown?.invalid_phones || 0} DEVIATIONS
                                            </span>
                                            <span className="px-3 py-1.5 rounded-lg text-[9px] font-tech font-bold tracking-widest bg-white/5 text-slate-400 border border-white/10">
                                                {run.row_count} DATA_POINTS
                                            </span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 ml-4 text-slate-600 group-hover:text-[#00f3ff] group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="relative z-10 p-6 border-t border-white/5 tech-panel mt-20">
                <div className="max-w-[1440px] mx-auto flex items-center justify-between text-[9px] font-tech uppercase tracking-[0.3em] text-slate-500">
                    <div className="flex items-center gap-6">
                        <span className="flex items-center gap-2">
                            <Activity className="w-3 h-3 text-[#0aff60]" />
                            System Health: Operational
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Encrypted Protocol Layer</span>
                        <Shield className="w-3 h-3 opacity-30" />
                    </div>
                </div>
            </footer>
        </div>
    );
}

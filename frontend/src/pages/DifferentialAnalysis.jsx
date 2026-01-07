import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
    ArrowLeft, GitCompare, Check, AlertTriangle, ArrowRight, Zap,
    Edit2, Shield, Briefcase, FileText, Download, Cpu, SlidersHorizontal,
    Terminal, AlertOctagon, ChevronRight, Search
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useChat } from "../context/ChatContext";
import { getRun, getRunDataPreview } from "../services/api";
import UnifiedFilterButton from "../components/UnifiedFilterButton";
import { useFilters } from "../context/FilterContext";

export default function DifferentialAnalysis() {
    const { projectId, runId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { getColors } = useTheme();
    const colors = getColors();
    const { setChatContext, setPageContext, clearChatContext } = useChat();

    const [run, setRun] = useState(null);
    const [loading, setLoading] = useState(true);
    const [changes, setChanges] = useState([]);
    const [originalData, setOriginalData] = useState({ columns: [], data: [] });
    const [cleanedData, setCleanedData] = useState({ columns: [], data: [] });
    const [showOnlyDiffs, setShowOnlyDiffs] = useState(false);

    const { getActiveFiltersJSON, filters } = useFilters();

    useEffect(() => {
        loadData();
        return () => {
            clearChatContext();
            setPageContext("");
        };
    }, [projectId, runId, filters]);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await getRun(projectId, runId);
            setRun(response.data);

            const reportChanges = response.data.report_data?.changes || [];
            setChanges(reportChanges);

            // Update Chatbot Context with first 10 deviations for analysis
            setPageContext("Differential Analysis");
            setChatContext({
                deviations: reportChanges.slice(0, 10),
                total_rows: response.data.row_count,
                file_name: response.data.file_name
            });

            const activeFiltersJSON = getActiveFiltersJSON();

            const [origRes, cleanRes] = await Promise.all([
                getRunDataPreview(projectId, runId, "original", 50, 0, activeFiltersJSON),
                getRunDataPreview(projectId, runId, "cleaned", 50, 0, activeFiltersJSON)
            ]);
            setOriginalData(origRes.data);
            setCleanedData(cleanRes.data);
        } catch (err) {
            console.error("Failed to load run data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (location.state?.from === 'diff-dashboard') {
            navigate('/differential-analysis');
        } else {
            navigate(`/projects/${projectId}/runs/${runId}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#030304]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-[#00f3ff]/20 border-t-[#00f3ff] rounded-full animate-spin shadow-[0_0_15px_rgba(0,243,255,0.3)]"></div>
                    <p className="font-tech text-[#00f3ff] animate-pulse tracking-[0.2em] uppercase text-xs">Initializing Analysis Matrix...</p>
                </div>
            </div>
        );
    }

    if (!run) return null;

    const metrics = {
        total: changes.length,
        auto: changes.filter(c => c.status === "auto_accepted" || c.status === "accepted").length,
        manual: changes.filter(c => c.status === "overridden" || c.manual_override).length,
        pending: changes.filter(c => c.status === "needs_review").length
    };

    return (
        <div className="min-h-screen bg-[#030304] text-slate-200 font-sans selection:bg-[#00f3ff]/30 selection:text-white">
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

                .scrollbar-cyber::-webkit-scrollbar { width: 6px; height: 6px; }
                .scrollbar-cyber::-webkit-scrollbar-track { background: #050507; }
                .scrollbar-cyber::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
                .scrollbar-cyber::-webkit-scrollbar-thumb:hover { background: #00f3ff; }
            `}</style>

            <div className="tech-grid fixed inset-0 pointer-events-none"></div>

            {/* Navigation Header */}
            <nav className="sticky top-0 z-50 tech-panel border-b border-white/5">
                <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={handleBack}
                            className="p-2 mr-2 rounded bg-white/5 border border-white/10 hover:border-[#00f3ff]/50 transition-all text-slate-400 hover:text-[#00f3ff]"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-[#00f3ff]/10 flex items-center justify-center border border-[#00f3ff]/50">
                                <Cpu className="w-5 h-5 text-[#00f3ff]" />
                            </div>
                            <span className="font-tech text-xl font-bold tracking-wider text-white">VETRI<span className="text-[#00f3ff]">DQX</span></span>
                        </div>

                        <div className="h-8 w-px bg-white/10"></div>

                        <div className="flex items-center gap-3">
                            <h1 className="text-sm font-medium text-slate-300 uppercase tracking-widest px-2">Differential Analysis</h1>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#bc13fe]/10 text-[#bc13fe] border border-[#bc13fe]/30 font-mono tracking-wide">
                                RUN #{run.run_number || 'ALPHA'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <UnifiedFilterButton columns={originalData.columns || []} isFuturistic />
                        <button className="flex items-center gap-2 px-4 py-2 rounded bg-[#00f3ff]/10 border border-[#00f3ff]/50 text-[#00f3ff] text-xs font-bold hover:bg-[#00f3ff]/20 hover:shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all uppercase tracking-wider">
                            <Download className="w-3 h-3" />
                            Batch Export
                        </button>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 max-w-[1440px] mx-auto px-6 py-8 w-full">

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Total Diffs', val: metrics.total, icon: GitCompare, color: '#00f3ff' },
                        { label: 'Auto Fixed', val: metrics.auto, icon: Zap, color: '#0aff60' },
                        { label: 'Manual Edits', val: metrics.manual, icon: Terminal, color: '#bc13fe' },
                        { label: 'Pending', val: metrics.pending, icon: AlertOctagon, color: '#ff003c' }
                    ].map((stat, i) => (
                        <div key={i} className="tech-panel p-5 rounded-lg flex items-center gap-5 glow-border transition-all duration-300 group overflow-hidden relative">
                            <div className="absolute inset-x-0 bottom-0 h-[2px] opacity-20 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: stat.color }}></div>
                            <div className="w-12 h-12 rounded bg-slate-800/30 flex items-center justify-center border border-white/5">
                                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
                                <p className="text-3xl font-tech font-bold text-white mt-1">{stat.val}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Change Log Table */}
                <div className="tech-panel rounded-lg overflow-hidden mb-12">
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-4">
                            <div className="w-1 h-5 bg-[#00f3ff] shadow-[0_0_10px_#00f3ff]"></div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em] font-tech text-glow-blue">Deep Change Log</h3>
                        </div>
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => navigate(`/projects/${projectId}/runs/${runId}/job-summary`)}
                                className="flex items-center gap-2 px-3 py-1 rounded border border-[#bc13fe]/30 text-[#bc13fe] text-[10px] font-tech uppercase tracking-widest hover:bg-[#bc13fe]/10 transition-all font-bold"
                            >
                                <Briefcase className="w-3 h-3" />
                                Job Summary
                            </button>
                            <div className="flex items-center gap-3 text-[10px] font-bold tracking-widest text-slate-500">
                                <span>CONFIDENCE MATRIX:</span>
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 rounded-sm bg-[#0aff60] shadow-[0_0_8px_#0aff60]"></div>
                                    <div className="w-2 h-2 rounded-sm bg-yellow-400/50"></div>
                                    <div className="w-2 h-2 rounded-sm bg-[#ff003c]/50"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto scrollbar-cyber">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#050507]">
                                <tr>
                                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Idx</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Field Mapping</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Original Input</th>
                                    <th className="p-4 w-8 border-b border-white/5"></th>
                                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Refined Output</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Core Logic</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Trust Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {changes.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Check className="w-12 h-12 text-[#0aff60] opacity-50" />
                                                <p className="font-tech text-slate-500 uppercase tracking-widest text-xs">No Matrix Deviations Detected</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    changes.map((change, idx) => (
                                        <tr key={idx} className="hover:bg-white/[0.03] transition-colors group">
                                            <td className="p-4 text-xs font-mono text-slate-600">
                                                {String(change.row_index + 1).padStart(3, '0')}
                                            </td>
                                            <td className="p-4 text-xs font-bold text-slate-300 uppercase tracking-wider">
                                                {change.column}
                                            </td>
                                            <td className="p-4">
                                                <span className="font-mono text-xs text-[#ff003c]/80 line-through decoration-[#ff003c]/50 decoration-2 italic">
                                                    {change.original_value || 'NULL'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-700">
                                                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:text-[#00f3ff] group-hover:translate-x-1 transition-all" />
                                            </td>
                                            <td className="p-4">
                                                <span className="font-mono text-xs text-[#00f3ff] font-medium px-2 py-1.5 rounded bg-[#00f3ff]/10 border border-[#00f3ff]/20 shadow-[0_0_10px_rgba(0,243,255,0.05)]">
                                                    {change.cleaned_value || 'NULL'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-[9px] font-mono text-slate-400 border border-white/10 px-2 py-1 rounded bg-black/20 uppercase tracking-tighter">
                                                    {change.fix_type}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full transition-all duration-500"
                                                            style={{
                                                                width: `${(change.confidence || 0) * 100}%`,
                                                                backgroundColor: change.confidence > 0.8 ? '#0aff60' : change.confidence > 0.5 ? '#facc15' : '#ff003c',
                                                                boxShadow: change.confidence > 0.8 ? '0 0 8px #0aff60' : 'none'
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[10px] font-mono font-bold" style={{
                                                        color: change.confidence > 0.8 ? '#0aff60' : change.confidence > 0.5 ? '#facc15' : '#ff003c'
                                                    }}>
                                                        {Math.round((change.confidence || 0) * 100)}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Data Matrix Section */}
                <div className="tech-panel rounded-lg overflow-hidden">
                    <div className="p-5 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.02]">
                        <div className="flex items-center gap-4">
                            <div className="w-1 h-5 bg-[#bc13fe] shadow-[0_0_10px_#bc13fe]"></div>
                            <div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em] font-tech text-glow-blue">Data Matrix</h3>
                                <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em] mt-1 font-tech">Dual-Channel Comparative Terminal</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex bg-black/60 p-1 rounded-lg border border-white/10 shadow-inner">
                                <button
                                    onClick={() => setShowOnlyDiffs(false)}
                                    className={`px-4 py-1.5 text-[9px] font-tech font-bold rounded transition-all tracking-widest ${!showOnlyDiffs ? 'bg-[#1e293b] text-[#00f3ff] shadow-[0_0_10px_rgba(0,243,255,0.2)]' : 'text-slate-500 hover:text-white'}`}
                                >
                                    FULL SYNC
                                </button>
                                <button
                                    onClick={() => setShowOnlyDiffs(true)}
                                    className={`px-4 py-1.5 text-[9px] font-tech font-bold rounded transition-all tracking-widest ${showOnlyDiffs ? 'bg-[#1e293b] text-[#00f3ff] shadow-[0_0_10px_rgba(0,243,255,0.2)]' : 'text-slate-500 hover:text-white'}`}
                                >
                                    DIFFS ONLY
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 divide-x divide-white/10">
                        {/* Raw Source Channel */}
                        <div className="overflow-hidden bg-[#ff003c]/[0.012]">
                            <div className="p-3 border-b border-white/5 text-center bg-[#ff003c]/[0.05] flex items-center justify-center gap-2">
                                <AlertTriangle className="w-3 h-3 text-[#ff003c]" />
                                <span className="text-[10px] font-tech font-bold text-[#ff003c] uppercase tracking-[0.3em] text-glow-red">Channel_1: RAW_SOURCE</span>
                            </div>
                            <div className="overflow-x-auto scrollbar-cyber max-h-[500px]">
                                <table className="w-full text-left font-mono">
                                    <thead className="bg-black/40 sticky top-0 border-b border-white/5">
                                        <tr>
                                            {originalData.columns?.map((col, i) => (
                                                <th key={i} className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-tighter whitespace-nowrap">
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-[11px]">
                                        {originalData.data?.filter((row, idx) => {
                                            if (!showOnlyDiffs) return true;
                                            const cleanRow = cleanedData.data?.[idx];
                                            if (!cleanRow) return false;
                                            return originalData.columns?.some(col => String(row[col]) !== String(cleanRow[col]));
                                        }).map((row, idx) => (
                                            <tr key={idx} className="h-10 hover:bg-white/[0.04] transition-all group">
                                                {originalData.columns?.map((col, i) => {
                                                    const cleanRow = cleanedData.data?.[idx];
                                                    const isDiff = cleanRow && String(row[col]) !== String(cleanRow[col]);
                                                    return (
                                                        <td key={i} className={`px-4 py-2 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis transition-colors ${isDiff ? 'text-[#ff003c] bg-[#ff003c]/5' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                                            {row[col] !== null ? String(row[col]) : <span className="opacity-30 italic">NULL</span>}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Refined Output Channel */}
                        <div className="overflow-hidden bg-[#00f3ff]/[0.012]">
                            <div className="p-3 border-b border-white/5 text-center bg-[#00f3ff]/[0.05] flex items-center justify-center gap-2">
                                <Zap className="w-3 h-3 text-[#00f3ff]" />
                                <span className="text-[10px] font-tech font-bold text-[#00f3ff] uppercase tracking-[0.3em] text-glow-blue">Channel_2: REFINED_OUTPUT</span>
                            </div>
                            <div className="overflow-x-auto scrollbar-cyber max-h-[500px]">
                                <table className="w-full text-left font-mono">
                                    <thead className="bg-black/40 sticky top-0 border-b border-white/5">
                                        <tr>
                                            {cleanedData.columns?.map((col, i) => (
                                                <th key={i} className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-tighter whitespace-nowrap">
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-[11px]">
                                        {cleanedData.data?.filter((row, idx) => {
                                            if (!showOnlyDiffs) return true;
                                            const origRow = originalData.data?.[idx];
                                            if (!origRow) return false;
                                            return cleanedData.columns?.some(col => String(row[col]) !== String(origRow[col]));
                                        }).map((row, idx) => (
                                            <tr key={idx} className="h-10 hover:bg-white/[0.04] transition-all group">
                                                {cleanedData.columns?.map((col, i) => {
                                                    const origRow = originalData.data?.[idx];
                                                    const isDiff = origRow && String(row[col]) !== String(origRow[col]);
                                                    return (
                                                        <td key={i} className={`px-4 py-2 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis transition-colors ${isDiff ? 'text-[#00f3ff] bg-[#00f3ff]/10 font-bold' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                                            {row[col] !== null ? String(row[col]) : <span className="opacity-30 italic">NULL</span>}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

            </main>

            {/* Footer Status Bar */}
            <footer className="relative z-10 p-4 border-t border-white/5 tech-panel mt-12">
                <div className="max-w-[1440px] mx-auto flex items-center justify-between text-[9px] font-tech uppercase tracking-[0.3em] text-slate-500">
                    <div className="flex items-center gap-6">
                        <span className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-[#0aff60] animate-pulse shadow-[0_0_5px_#0aff60]"></div>
                            AI Core: Synced
                        </span>
                        <span className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-[#00f3ff] animate-pulse"></div>
                            Data Integrity: Nominal
                        </span>
                        <span className="flex items-center gap-2">
                            <FileText className="w-3 h-3 opacity-50" />
                            File: {run.file_name}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Encrypted Neural Link: Active</span>
                        <Shield className="w-3 h-3 text-[#0aff60]/50" />
                    </div>
                </div>
            </footer>
        </div>
    );
}

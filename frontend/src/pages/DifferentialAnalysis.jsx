import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, GitCompare, Check, AlertTriangle, ArrowRight, Zap, Edit2, Shield, Briefcase } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { getRun, getRunDataPreview } from "../services/api";
import UnifiedFilterButton from "../components/UnifiedFilterButton";
import { useFilters } from "../context/FilterContext";

export default function DifferentialAnalysis() {
    const { projectId, runId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { getColors } = useTheme();
    const colors = getColors();

    const [run, setRun] = useState(null);
    const [loading, setLoading] = useState(true);
    const [changes, setChanges] = useState([]);
    const [originalData, setOriginalData] = useState({ columns: [], data: [] });
    const [cleanedData, setCleanedData] = useState({ columns: [], data: [] });
    const [showOnlyDiffs, setShowOnlyDiffs] = useState(false);

    const { getActiveFiltersJSON, filters } = useFilters();

    useEffect(() => {
        loadData();
    }, [projectId, runId, filters]);

    const handleBack = () => {
        if (location.state?.from === 'diff-dashboard') {
            navigate('/differential-analysis');
        } else {
            navigate(`/projects/${projectId}/runs/${runId}`);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await getRun(projectId, runId);
            setRun(response.data);

            // Extract changes from report_data
            const reportChanges = response.data.report_data?.changes || [];

            // Client-side filtering for changes list (optional, if we want to filter the summary table too)
            // But we already have server-side filtering ready for the grid view via getRunDataPreview
            setChanges(reportChanges);

            const activeFiltersJSON = getActiveFiltersJSON();

            // Fetch Previews
            const [origRes, cleanRes] = await Promise.all([
                // Original data might not be filtered by "changes filters", but usually we want to see correlated rows.
                // If the backend `get_run_data_preview` filters based on `fix_type`, it returns rows that matched.
                // So we should pass filters to both if we want to see "rows with email fixes".
                getRunDataPreview(projectId, runId, "original", 50, 0, activeFiltersJSON),
                getRunDataPreview(projectId, runId, "cleaned", 50, 0, activeFiltersJSON)
            ]);
            setOriginalData(origRes.data);
            setCleanedData(cleanRes.data);
        } catch (err) {
            console.error("Failed to load run data:", err);
            // In a real app we'd show a toast
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center transition-colors duration-500" style={{ backgroundColor: colors.primary }}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: colors.accent1 }}></div>
            </div>
        );
    }

    if (!run) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>Run Not Found</h2>
                    <button onClick={() => navigate(-1)} className="px-4 py-2 rounded text-white" style={{ backgroundColor: colors.accent1 }}>
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const metrics = {
        total: changes.length,
        auto: changes.filter(c => c.status === "auto_accepted" || c.status === "accepted").length,
        manual: changes.filter(c => c.status === "overridden" || c.manual_override).length,
        pending: changes.filter(c => c.status === "needs_review").length
    };

    return (
        <div className="min-h-screen transition-colors duration-500" style={{ backgroundColor: colors.primary }}>
            {/* Background Pattern */}
            <div className="fixed inset-0 opacity-5 pointer-events-none">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(${colors.textSecondary} 1px, transparent 1px)`,
                    backgroundSize: '30px 30px'
                }}></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            className="p-2 rounded-xl transition-all hover:scale-105"
                            style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}
                        >
                            <ArrowLeft className="w-5 h-5" style={{ color: colors.textSecondary }} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
                                    Differential Analysis
                                </h1>
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600">
                                    RUN #{run.run_number}
                                </span>
                            </div>
                            <p style={{ color: colors.textSecondary }}>Checking differences between Original and Cleaned data</p>
                        </div>
                    </div>
                    <div>
                        <UnifiedFilterButton columns={originalData.columns || []} />
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 rounded-xl flex items-center gap-4" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                        <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                            <GitCompare className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>Total Differences</p>
                            <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{metrics.total}</p>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl flex items-center gap-4" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                        <div className="p-3 rounded-lg bg-green-100 text-green-600">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>Auto Fixed</p>
                            <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{metrics.auto}</p>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl flex items-center gap-4" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                        <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                            <Edit2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>Manual Edits</p>
                            <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{metrics.manual}</p>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl flex items-center gap-4" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                        <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>Pending</p>
                            <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{metrics.pending}</p>
                        </div>
                    </div>
                </div>

                {/* Job Analysis Button */}
                <div className="flex justify-end mb-6">
                    <button
                        onClick={() => navigate(`/projects/${projectId}/runs/${runId}/job-summary`)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium hover:opacity-90 transition-all shadow-md"
                        style={{ background: `linear-gradient(135deg, ${colors.accent2}, ${colors.primary})` }}
                    >
                        <Briefcase className="w-4 h-4" />
                        Job Analysis
                    </button>
                </div>

                {/* Diff Table */}
                <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                    <div className="p-6 border-b" style={{ borderColor: colors.border }}>
                        <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>Detailed Changes</h3>
                    </div>

                    {changes.length === 0 ? (
                        <div className="p-12 text-center">
                            <Check className="w-12 h-12 mx-auto mb-3 text-green-500" />
                            <p className="font-medium" style={{ color: colors.textPrimary }}>No differences found!</p>
                            <p className="text-sm" style={{ color: colors.textSecondary }}>The cleaned file is identical to the original.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr style={{ backgroundColor: colors.secondary }}>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textSecondary }}>Row</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textSecondary }}>Column</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textSecondary }}>Original Value</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textSecondary }}></th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textSecondary }}>Cleaned Value</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textSecondary }}>Algorithm</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textSecondary }}>Confidence</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ divideColor: colors.border }}>
                                    {changes.map((change, idx) => (
                                        <tr key={idx} className="hover:bg-black/5 transition-colors">
                                            <td className="p-4 font-mono text-sm" style={{ color: colors.textSecondary }}>
                                                #{change.row_index + 1}
                                            </td>
                                            <td className="p-4 font-medium text-sm" style={{ color: colors.textPrimary }}>
                                                {change.column}
                                            </td>
                                            <td className="p-4 text-sm font-medium text-red-500 bg-red-50/50 rounded-lg">
                                                {change.original_value || <span className="text-gray-400 italic">null</span>}
                                            </td>
                                            <td className="p-4 text-center">
                                                <ArrowRight className="w-4 h-4 text-gray-400" />
                                            </td>
                                            <td className="p-4 text-sm font-bold text-green-600 bg-green-50/50 rounded-lg">
                                                {change.cleaned_value || <span className="text-gray-400 italic">null</span>}
                                            </td>
                                            <td className="p-4 text-xs">
                                                <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 font-medium">
                                                    {change.fix_type}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full"
                                                            style={{
                                                                width: `${(change.confidence || 0) * 100}%`,
                                                                backgroundColor: change.confidence > 0.8 ? '#10b981' : change.confidence > 0.5 ? '#f59205' : '#ef4444'
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                                                        {Math.round((change.confidence || 0) * 100)}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Full Data Comparison */}
            <div className="mt-8 rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: colors.border }}>
                    <div>
                        <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>Full Data Comparison</h3>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>Side-by-side view of Original vs Cleaned Data (First 50 rows)</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center cursor-pointer gap-2">
                            <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>Show Only Differences</span>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={showOnlyDiffs}
                                    onChange={() => setShowOnlyDiffs(!showOnlyDiffs)}
                                />
                                <div className={`w-10 h-6 rounded-full shadow-inner transition-colors duration-200 ${showOnlyDiffs ? 'bg-purple-600' : 'bg-gray-400'}`}></div>
                                <div className={`absolute w-4 h-4 bg-white rounded-full shadow top-1 transition-transform duration-200 ${showOnlyDiffs ? 'left-5' : 'left-1'}`}></div>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-2 divide-x" style={{ divideColor: colors.border }}>
                    {/* Original Side */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr style={{ backgroundColor: `${colors.secondary}80` }}>
                                    {originalData.columns?.map((col, i) => (
                                        <th key={i} className="p-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: colors.textSecondary }}>
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ divideColor: colors.border }}>
                                {originalData.data?.filter((row, idx) => {
                                    if (!showOnlyDiffs) return true;
                                    // Check if this row has any changes in the cleaned version
                                    const cleanRow = cleanedData.data?.[idx];
                                    if (!cleanRow) return false;

                                    return originalData.columns?.some(col => String(row[col]) !== String(cleanRow[col]));
                                }).map((row, idx) => (
                                    <tr key={idx} className="hover:bg-black/5 h-12">
                                        {originalData.columns?.map((col, i) => (
                                            <td key={i} className="p-3 text-xs whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis" style={{ color: colors.textSecondary }}>
                                                {row[col] !== null ? String(row[col]) : <span className="text-gray-300 italic">null</span>}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Cleaned Side */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr style={{ backgroundColor: `${colors.secondary}` }}>
                                    {cleanedData.columns?.map((col, i) => (
                                        <th key={i} className="p-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: colors.textSecondary }}>
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ divideColor: colors.border }}>
                                {cleanedData.data?.map((row, idx) => {
                                    // Find original row to compare
                                    const origRow = originalData.data?.[idx];

                                    // Calculate diff status for entire row to handle filtering
                                    const hasDiff = cleanedData.columns?.some(col => origRow && String(origRow[col]) !== String(row[col]));

                                    if (showOnlyDiffs && !hasDiff) return null;

                                    return (
                                        <tr key={idx} className="hover:bg-black/5 h-12">
                                            {cleanedData.columns?.map((col, i) => {
                                                const isDiff = origRow && String(origRow[col]) !== String(row[col]);
                                                return (
                                                    <td
                                                        key={i}
                                                        className={`p-3 text-xs whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis ${isDiff ? 'bg-green-50 font-medium text-green-700' : ''}`}
                                                        style={{ color: isDiff ? undefined : colors.textPrimary }}
                                                    >
                                                        {row[col] !== null ? String(row[col]) : <span className="text-gray-300 italic">null</span>}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

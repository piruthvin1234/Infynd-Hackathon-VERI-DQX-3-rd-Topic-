import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter, Briefcase, ChevronDown, ChevronUp } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";

export default function JobNormalizationSummary() {
    const { projectId, runId } = useParams();
    const navigate = useNavigate();
    const { getColors, getThemeInfo } = useTheme();
    const [summary, setSummary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedCategory, setExpandedCategory] = useState(null);

    const colors = getColors();

    useEffect(() => {
        fetchJobSummary();
    }, [projectId, runId]);

    const fetchJobSummary = async () => {
        try {
            const response = await api.get(`/api/projects/${projectId}/runs/${runId}/job-summary`);
            setSummary(response.data.job_function_summary || []);
        } catch (error) {
            console.error("Failed to fetch summary", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleCategory = (category) => {
        setExpandedCategory(expandedCategory === category ? null : category);
    };

    const filteredSummary = summary.map(cat => ({
        ...cat,
        job_titles: cat.job_titles.filter(title =>
            title.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(cat =>
        cat.job_function.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.job_titles.length > 0
    );

    return (
        <div className="min-h-screen transition-colors duration-500" style={{ backgroundColor: colors.primary }}>
            {/* Header */}
            <div className="sticky top-0 z-20 shadow-sm" style={{ backgroundColor: colors.cardBg, borderBottom: `1px solid ${colors.border}` }}>
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-xl transition-all hover:scale-105"
                            style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}
                        >
                            <ArrowLeft className="w-5 h-5" style={{ color: colors.textSecondary }} />
                        </button>
                        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
                            <Briefcase className="w-6 h-6 text-blue-500" />
                            Job Title Normalization Summary
                        </h1>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Search & Stats */}
                <div className="flex flex-col md:flex-row gap-6 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search job titles or functions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border outline-none focus:ring-2 transition-all"
                            style={{
                                backgroundColor: colors.cardBg,
                                borderColor: colors.border,
                                color: colors.textPrimary
                            }}
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="px-6 py-3 rounded-xl border flex items-center gap-2" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
                            <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>Total Functions:</span>
                            <span className="text-xl font-bold" style={{ color: colors.textPrimary }}>{summary.length}</span>
                        </div>
                    </div>
                </div>

                {/* Categories List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-12" style={{ color: colors.textSecondary }}>Loading analysis...</div>
                    ) : filteredSummary.length === 0 ? (
                        <div className="text-center py-12" style={{ color: colors.textSecondary }}>No data found matching your search.</div>
                    ) : (
                        filteredSummary.map((item, idx) => (
                            <div
                                key={idx}
                                className="rounded-2xl border overflow-hidden transition-all duration-300"
                                style={{
                                    backgroundColor: colors.cardBg,
                                    borderColor: colors.border,
                                    boxShadow: expandedCategory === item.job_function ? '0 8px 30px rgba(0,0,0,0.12)' : 'none'
                                }}
                            >
                                <button
                                    onClick={() => toggleCategory(item.job_function)}
                                    className="w-full flex items-center justify-between p-5 text-left hover:bg-black/5 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${expandedCategory === item.job_function ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                            <Briefcase className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                                                {item.job_function}
                                            </h3>
                                            <p className="text-sm" style={{ color: colors.textSecondary }}>
                                                {item.job_titles.length} Unique Titles
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                            {item.count} Records
                                        </span>
                                        {expandedCategory === item.job_function ? (
                                            <ChevronUp className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                </button>

                                {expandedCategory === item.job_function && (
                                    <div className="border-t bg-black/5" style={{ borderColor: colors.border }}>
                                        <div className="p-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {item.job_titles.map((title, tIdx) => (
                                                <div
                                                    key={tIdx}
                                                    className="px-4 py-3 rounded-lg text-sm flex items-center gap-2 group hover:bg-white transition-all cursor-default"
                                                    style={{ color: colors.textSecondary }}
                                                >
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:scale-125 transition-transform" />
                                                    {title}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

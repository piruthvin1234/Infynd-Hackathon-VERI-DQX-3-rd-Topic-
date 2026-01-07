import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, X, ChevronDown, ChevronUp, Search, Upload, FileText, Download, Sparkles, CheckCircle2, XCircle, AlertCircle, Zap, Database, BarChart3, Filter, Mail, Phone, Copy } from 'lucide-react';
import HeptagonChart from '../components/HeptagonChart';
import Chatbot from '../components/Chatbot';

// Mock context hooks for demo
const useTheme = () => ({
    getColors: () => ({
        primary: '#0a0e27',
        secondary: '#1a1f3a',
        cardBg: '#151929',
        border: '#2a3150',
        textPrimary: '#e5e7eb',
        textSecondary: '#9ca3af',
        accent1: '#3b82f6',
        accent2: '#8b5cf6'
    })
});

const useFilters = () => ({
    filters: {
        email: false,
        phone: false,
        job_normalization: false,
        missing_fields: false,
        fake_domain: false
    }
});

// Simplified Modal Component for Job Analysis
const JobAnalysisModal = ({ rows, onClose, colors }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [summary, setSummary] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const analyzeJobs = async () => {
            if (!rows || rows.length === 0) {
                setLoading(false);
                return;
            }

            // Extract titles
            // Find title column first - robust search
            const firstRow = rows[0];
            const keys = Object.keys(firstRow);
            const titleKey = keys.find(k => k.toLowerCase() === 'jobtitle') ||
                keys.find(k => k.toLowerCase() === 'job title') ||
                keys.find(k => k.toLowerCase() === 'job_title') ||
                keys.find(k => k.toLowerCase() === 'title') ||
                keys.find(k => k.toLowerCase() === 'role');

            if (!titleKey) {
                console.log("No job title column found for analysis");
                setLoading(false);
                return;
            }

            // Limit to unique titles first to save bandwidth
            const uniqueTitles = [...new Set(rows.map(r => r[titleKey]).filter(t => t && String(t).trim().length > 0))];

            try {
                const res = await fetch("http://localhost:8000/api/job-analysis", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ titles: uniqueTitles })
                });
                if (res.ok) {
                    const data = await res.json();
                    setSummary(data.job_function_summary || []);
                } else {
                    console.error("Analysis failed", res.status);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        analyzeJobs();
    }, [rows]);

    const filteredSummary = summary.map(cat => ({
        ...cat,
        job_titles: cat.job_titles.filter(title =>
            title.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(cat =>
        cat.job_function.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.job_titles.length > 0
    );

    const toggleCategory = (category) => {
        setExpandedCategory(expandedCategory === category ? null : category);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md">
            <div className="w-full max-w-5xl max-h-[90vh] m-4 rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: colors.border, background: `linear-gradient(135deg, ${colors.secondary}, ${colors.cardBg})` }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                            <Briefcase className="w-6 h-6 text-white" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
                                Job Title Normalization Summary
                            </h1>
                            <p className="text-sm" style={{ color: colors.textSecondary }}>Standardized categorization using AI Model</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-6 h-6" style={{ color: colors.textSecondary }} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
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
                                    backgroundColor: colors.secondary,
                                    borderColor: colors.border,
                                    color: colors.textPrimary
                                }}
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="px-6 py-3 rounded-xl border flex items-center gap-2" style={{ backgroundColor: colors.secondary, borderColor: colors.border }}>
                                <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>Total Functions:</span>
                                <span className="text-xl font-bold" style={{ color: colors.textPrimary }}>{summary.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Categories List */}
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-12" style={{ color: colors.textSecondary }}>
                                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                Loading analysis from AI Model...
                            </div>
                        ) : filteredSummary.length === 0 ? (
                            <div className="text-center py-12" style={{ color: colors.textSecondary }}>No data found matching your search.</div>
                        ) : (
                            filteredSummary.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="rounded-2xl border overflow-hidden transition-all duration-300"
                                    style={{
                                        backgroundColor: colors.secondary,
                                        borderColor: colors.border,
                                        boxShadow: expandedCategory === item.job_function ? '0 8px 30px rgba(0,0,0,0.12)' : 'none'
                                    }}
                                >
                                    <button
                                        onClick={() => toggleCategory(item.job_function)}
                                        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${expandedCategory === item.job_function ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/10 text-gray-500'}`}>
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
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                {item.count} Items
                                            </span>
                                            {expandedCategory === item.job_function ? (
                                                <ChevronUp className="w-5 h-5" style={{ color: colors.textSecondary }} />
                                            ) : (
                                                <ChevronDown className="w-5 h-5" style={{ color: colors.textSecondary }} />
                                            )}
                                        </div>
                                    </button>

                                    {expandedCategory === item.job_function && (
                                        <div className="border-t bg-black/5" style={{ borderColor: colors.border }}>
                                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {item.job_titles.map((title, tIdx) => (
                                                    <div
                                                        key={tIdx}
                                                        className="px-4 py-3 rounded-lg text-sm flex items-center gap-2 group hover:bg-white/5 transition-all cursor-default border border-transparent hover:border-white/10"
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
        </div>
    );
};

const DataQualityCopilot = () => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [mode, setMode] = useState('clean');
    const [activeDetailView, setActiveDetailView] = useState(null);
    const [detailFilter, setDetailFilter] = useState('ALL');
    const [consistencyDecisions, setConsistencyDecisions] = useState({});

    // Reset filter and decisions when view changes (optional, maybe keep decisions?)
    useEffect(() => {
        setDetailFilter('ALL');
    }, [activeDetailView]);

    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [cleanedData, setCleanedData] = useState(null);
    const [summaryStats, setSummaryStats] = useState(null);
    const [showJobAnalysis, setShowJobAnalysis] = useState(false);

    // Helper to get inconsistent rows for the table
    const getInconsistentRows = () => {
        if (!summaryStats?.consistency_check?.column) return [];
        const col = summaryStats.consistency_check.column;
        const checkCol = `${col}_is_inconsistent`;
        return rows.filter(r => r[checkCol] === true || r[checkCol] === "true"); // Handle potential string conversion in JSON
    };

    // Unified Filter State
    const [columns, setColumns] = useState([]);
    const [featureConfig, setFeatureConfig] = useState({
        duplicates: { enabled: false, columns: [] },
        email_validation: { enabled: false, column: '' },
        phone_validation: { enabled: false, column: '', region: 'GB' },
        missing_values: { enabled: false },
        consistency_check: { enabled: false, column: '' },
        job_normalization: { enabled: false, column: '' } // kept for compatibility if needed, though consistency_check might replace it
    });

    const { getColors } = useTheme();
    const colors = getColors();
    const { filters } = useFilters();
    const navigate = useNavigate();

    const handleAnalyseAndClean = async () => {
        if (selectedFiles.length === 0) return;

        setLoading(true);
        // Artificial delay of 20 seconds as requested by the user
        await new Promise(resolve => setTimeout(resolve, 20000));

        const allRows = [];

        try {
            // Check if we are using Unified Custom Logic
            const isCustomLogic = Object.values(featureConfig).some(f => f.enabled);
            const endpoint = isCustomLogic ? "http://localhost:8000/api/unified-clean" : "http://localhost:8000/api/upload-csv";

            // Process each file sequentially
            for (const file of selectedFiles) {
                const formData = new FormData();
                formData.append("file", file);

                if (isCustomLogic) {
                    const config = {
                        features: featureConfig
                    };
                    formData.append("config", JSON.stringify(config));
                }

                const res = await fetch(endpoint, {
                    method: "POST",
                    body: formData
                });

                if (!res.ok) {
                    throw new Error(`Server error: ${res.status}`);
                }

                const data = await res.json();
                // Add filename to each row
                const rowsWithFilename = (data.results || []).map(row => ({
                    ...row,
                    filename: file.name
                }));
                allRows.push(...rowsWithFilename);

                // Store summary stats (using the last file's summary if multiple, or merge them? simpler to overwrite for now)
                if (data.summary) {
                    setSummaryStats(data.summary);
                }
            }

            setRows(allRows);
            setCleanedData(allRows);
        } catch (err) {
            console.error("Upload failed", err);
            alert(`Upload failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async () => {
        if (selectedFiles.length === 0) return;

        setLoading(true);
        const token = localStorage.getItem("token");

        try {
            // For review mode, we'll use the first file only
            const formData = new FormData();
            formData.append("file", selectedFiles[0]);

            const res = await fetch("http://localhost:8000/upload-for-review/", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) {
                throw new Error(`Server error: ${res.status}`);
            }

            const data = await res.json();
            // Navigate to ReviewUI page with session parameter
            navigate(`/review?session=${data.session_id}`);
        } catch (err) {
            console.error("Upload for review failed", err);
            alert(`Upload failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const downloadCleanedCSV = () => {
        if (!cleanedData || cleanedData.length === 0) return;

        // Group by filename if multiple files
        const fileGroups = cleanedData.reduce((acc, row) => {
            const filename = row.filename || 'data.csv';
            if (!acc[filename]) acc[filename] = [];

            // Apply consistency decisions if any
            const consistencyCol = summaryStats?.consistency_check?.column;
            const unifiedCol = `${consistencyCol}_unified`;
            let finalRow = { ...row };

            if (consistencyCol && finalRow[unifiedCol]) {
                const decision = consistencyDecisions[row.row];
                if (decision === 'accept') {
                    finalRow[consistencyCol] = finalRow[unifiedCol]; // Overwrite original
                }
                // If reject or pending, keep original (no action needed as row starts with original)
            }

            acc[filename].push(finalRow);
            return acc;
        }, {});

        // Download each file separately
        Object.entries(fileGroups).forEach(([filename, rows]) => {
            // Adjust headers to include consistency column if exists
            const consistencyCol = summaryStats?.consistency_check?.column;

            // Base headers
            let headers = ['row', 'company_name', 'email', 'email_status', 'suggested_email', 'confidence', 'phone', 'phone_status', 'formatted_phone'];

            // Add dynamic headers if they exist in row
            if (consistencyCol) headers.push(consistencyCol);

            const csvContent = [
                headers.join(','),
                ...rows.map(r => {
                    const baseData = [
                        r.row,
                        `"${r.company_name || ''}"`,
                        `"${r.email || ''}"`,
                        r.email_status,
                        `"${r.email_fix || ''}"`,
                        r.email_confidence,
                        `"${r.phone || ''}"`,
                        r.phone_status,
                        `"${r.formatted_phone || ''}"`
                    ];
                    if (consistencyCol) baseData.push(`"${r[consistencyCol] || ''}"`);
                    return baseData.join(',');
                })
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cleaned_${filename}`;
            a.click();
            window.URL.revokeObjectURL(url);
        });
    };

    const handleConsistencyDecision = (rowId, decision) => {
        setConsistencyDecisions(prev => ({
            ...prev,
            [rowId]: decision // 'accept' or 'reject'
        }));
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            setSelectedFiles(files);
            setRows([]);
            setCleanedData(null);

            // Parse headers from the first file for configuration
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target.result;
                const firstLine = text.split('\n')[0];
                const headers = firstLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                setColumns(headers);

                // Auto-guess columns
                const emailCol = headers.find(h => h.toLowerCase().includes('email')) || '';
                const phoneCol = headers.find(h => h.toLowerCase().includes('phone') || h.toLowerCase().includes('mobile')) || '';
                const titleCol = headers.find(h => h.toLowerCase().includes('job') || h.toLowerCase().includes('title') || h.toLowerCase().includes('industry')) || '';

                setFeatureConfig(prev => ({
                    ...prev,
                    email_validation: { ...prev.email_validation, column: emailCol },
                    phone_validation: { ...prev.phone_validation, column: phoneCol },
                    duplicates: { ...prev.duplicates, columns: emailCol ? [emailCol] : [] },
                    consistency_check: {
                        ...prev.consistency_check,
                        column: titleCol,
                        enabled: !!titleCol  // Auto-enable if column found
                    }
                }));
            };
            reader.readAsText(files[0]);
        }
    };

    const toggleFeature = (key) => {
        setFeatureConfig(prev => ({
            ...prev,
            [key]: { ...prev[key], enabled: !prev[key].enabled }
        }));
    };

    const updateFeatureConfig = (key, field, value) => {
        setFeatureConfig(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };

    // Generate chart data based on summary stats
    const chartData = useMemo(() => {
        if (!summaryStats) return [
            { label: "Duplicates", value: "0%" },
            { label: "Missing Fields", value: "0%" },
            { label: "Invalid Phone Numbers", value: "0%" },
            { label: "Mismapped Job Titles", value: "0%" },
            { label: "Overall Confidence Level", value: "0%" },
            { label: "Data Quality", value: "0%" },
            { label: "Email Validation", value: "0%" }
        ];

        const totalRows = rows.length || summaryStats.rows_processed || 1;
        const totalCols = columns.length || summaryStats.columns?.length || 1;

        // 1. Duplicates (Show Amount Detected)
        const dupCount = summaryStats.duplicates?.count || 0;
        const dupPct = Math.min(100, Math.round((dupCount / totalRows) * 100));
        const dupDisplay = (dupCount > 0 && dupPct === 0) ? "<1%" : `${dupPct}%`;

        // 2. Missing Fields (Show Amount Detected)
        const missingTotal = summaryStats.missing_values?.total_missing_cells || 0;
        // Total cells is rows * columns, but for the chart we often want "Rows with missing data" or "Percentage of Missing Cells"
        // Let's stick to percentage of missing cells for accuracy, or percentage of rows with missing data if that's what user expects.
        // User request "missing fields... calculation wrong".
        // If "Missing Fields" means "Avg Missing per row" or "% Rows affected", let's assume % Rows affected is clearer for a heptagon 0-100 scale.
        // BUT, looking at backend, we don't return 'rows with missing values' count directly in summaryStats.missing_values.
        // we added "missing_count" to each row.
        // Let's recalculate rows with missing vals here if possible, OR stick to cell percentage.
        // Cell percentage is safer:
        const totalCells = totalRows * totalCols;
        const missingPct = Math.min(100, Math.round((missingTotal / totalCells) * 100));
        const missingDisplay = (missingTotal > 0 && missingPct === 0) ? "<1%" : `${missingPct}%`;

        // 3. Invalid Phone (Show Amount Detected)
        const phoneBreakdown = summaryStats.phone_validation?.breakdown || {};
        const phoneIssues = (phoneBreakdown.INVALID || 0) + (phoneBreakdown.MISSING || 0);
        const phonePct = Math.min(100, Math.round((phoneIssues / totalRows) * 100));
        const phoneDisplay = (phoneIssues > 0 && phonePct === 0) ? "<1%" : `${phonePct}%`;

        // 4. Mismapped Job Titles (Show Amount Detected)
        const consistencyFound = summaryStats.consistency_check?.inconsistencies_found || 0;
        // User requested to "change such similar errors for all", implying consistency check
        // should also penalize missing values in that specific column (Job Title), just like Phone/Email.
        const consistencyCol = summaryStats.consistency_check?.column;
        const consistencyMissing = (consistencyCol && summaryStats.missing_values?.by_column?.[consistencyCol]) || 0;

        const consistencyIssues = consistencyFound + consistencyMissing;
        const consistencyPct = Math.min(100, Math.round((consistencyIssues / totalRows) * 100));
        const consistencyDisplay = (consistencyIssues > 0 && consistencyPct === 0) ? "<1%" : `${consistencyPct}%`;

        // 5. Overall Confidence (Keep as Positive Metric: Higher is better)
        // Heuristic: Start with 100 and subtract absolute penalties for issues
        let calcConfidence = 100;
        calcConfidence -= (dupPct * 0.5);
        calcConfidence -= (missingPct * 0.5);
        calcConfidence -= (phonePct * 0.5);
        calcConfidence -= (consistencyPct * 0.5);
        // User Request: "overall confidence must always be - above 65"
        calcConfidence = Math.max(65, Math.round(calcConfidence));

        // 6. Data Quality (Keep as Positive Metric: Higher is better)
        const qualityScore = summaryStats.quality_score || calcConfidence;

        // 7. Email Validation (Show Amount of INVALID + MISSING Emails Detected)
        const emailBreakdown = summaryStats.email_validation?.breakdown || {};
        // User wants to see impact even if just missing.
        const emailInvalid = (emailBreakdown.INVALID || 0) + (emailBreakdown.MISSING || 0);
        const emailPct = Math.min(100, Math.round((emailInvalid / totalRows) * 100));
        const emailDisplay = (emailInvalid > 0 && emailPct === 0) ? "<1%" : `${emailPct}%`;

        return [
            { label: "Duplicates", value: dupDisplay },
            { label: "Missing Fields", value: missingDisplay },
            { label: "Invalid Phone Numbers", value: phoneDisplay },
            { label: "Title Inconsistency Check (LLM)", value: consistencyDisplay },
            { label: "Overall Confidence Level", value: `${calcConfidence}%` },
            { label: "Data Quality", value: `${qualityScore}%` },
            { label: "Email Validation", value: emailDisplay }
        ];
    }, [summaryStats, rows.length, columns.length]);

    const filteredRows = useMemo(() => {
        if (!rows) return [];
        const activeFilters = Object.values(filters).some(Boolean);
        if (!activeFilters) return rows;

        return rows.filter(row => {
            if (filters.email && (row.email_status !== 'VALID' || row.email_fix)) return true;
            if (filters.phone && (row.phone_status !== 'VALID' || row.phone_fix)) return true;
            if (filters.job_normalization && row.job_function) return true;
            if (filters.missing_fields && (!row.email || !row.company_name)) return true;
            if (filters.fake_domain && row.email_status === "INVALID_DOMAIN") return true;
            return false;
        });
    }, [rows, filters]);

    // specific rows for the detailed interactive view (cards)
    const detailViewRows = useMemo(() => {
        if (!activeDetailView || !rows || rows.length === 0) return [];
        if (!summaryStats) return [];

        let filtered = [];
        if (activeDetailView === 'EMAIL') filtered = rows.filter(r => r.email_status !== 'VALID');
        if (activeDetailView === 'PHONE') filtered = rows.filter(r => r.phone_status !== 'VALID');
        if (activeDetailView === 'DUPLICATES') filtered = rows.filter(r => r.is_duplicate === true);
        if (activeDetailView === 'MISSING') filtered = rows.filter(r => r.missing_count > 0).sort((a, b) => b.missing_count - a.missing_count);
        if (activeDetailView === 'CONSISTENCY') {
            const colKey = summaryStats?.consistency_check?.column;
            const inconsistentKey = `${colKey}_is_inconsistent`;
            filtered = rows.filter(r => r[inconsistentKey] === true || r[inconsistentKey] === "true");
        }
        return filtered;
    }, [activeDetailView, rows, summaryStats]);

    // Filter logic for detail view
    const uniqueStatuses = useMemo(() => {
        if (!detailViewRows || detailViewRows.length === 0) return [];
        if (activeDetailView === 'EMAIL') {
            return [...new Set(detailViewRows.map(r => r.email_status))].filter(Boolean).sort();
        }
        if (activeDetailView === 'PHONE') {
            return [...new Set(detailViewRows.map(r => r.phone_status))].filter(Boolean).sort();
        }
        return [];
    }, [detailViewRows, activeDetailView]);

    const filteredDetailRows = useMemo(() => {
        if (detailFilter === 'ALL') return detailViewRows;
        return detailViewRows.filter(r => {
            if (activeDetailView === 'EMAIL') return r.email_status === detailFilter;
            if (activeDetailView === 'PHONE') return r.phone_status === detailFilter;
            return true;
        });
    }, [detailViewRows, detailFilter, activeDetailView]);

    return (
        <div className="min-h-screen p-8 transition-colors duration-500" style={{ backgroundColor: colors.primary }}>
            {/* Header */}
            <header
                className="sticky top-0 z-50 backdrop-blur-xl shadow-lg mb-8 -mx-8 -mt-8 px-8 py-5"
                style={{
                    backgroundColor: `${colors.cardBg}dd`,
                    borderBottom: `1px solid ${colors.border}`,
                }}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 border"
                            style={{
                                backgroundColor: colors.secondary,
                                borderColor: colors.border,
                            }}
                        >
                            <ArrowLeft className="w-5 h-5" style={{ color: colors.textPrimary }} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                                <Zap className="w-6 h-6 text-white" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    Data Quality Copilot
                                </h1>
                                <p className="text-sm" style={{ color: colors.textSecondary }}>
                                    AI-Powered Data Validation & Enrichment Platform
                                </p>
                            </div>
                        </div>
                    </div>
                    {rows.length > 0 && (
                        <button
                            onClick={() => setShowJobAnalysis(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 font-semibold hover:bg-blue-500/20 transition-all border border-blue-500/20"
                        >
                            <Briefcase className="w-5 h-5" />
                            Job Analysis
                        </button>
                    )}
                </div>
            </header>

            <div className="max-w-7xl mx-auto">
                {/* Upload Section */}
                <div
                    className="p-10 rounded-2xl mb-12 max-w-3xl mx-auto transition-all duration-500 border"
                    style={{
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border,
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    }}
                >
                    <div className="mb-8 text-center">
                        <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 mb-4">
                            <Upload className="w-12 h-12 text-blue-400" strokeWidth={1.5} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                            Upload Data Files
                        </h2>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                            Select CSV files to begin advanced data quality analysis
                        </p>
                    </div>

                    <label
                        className="relative cursor-pointer group block mb-6"
                    >
                        <div
                            className="border-2 border-dashed rounded-xl p-8 transition-all duration-300 hover:border-blue-500"
                            style={{ borderColor: colors.border }}
                        >
                            <div className="text-center">
                                <FileText className="w-10 h-10 mx-auto mb-3 text-blue-400 group-hover:scale-110 transition-transform" />
                                <p className="font-semibold mb-1" style={{ color: colors.textPrimary }}>
                                    {selectedFiles.length === 0
                                        ? 'Click to browse or drag and drop'
                                        : `${selectedFiles.length} file(s) selected`
                                    }
                                </p>
                                <p className="text-xs" style={{ color: colors.textSecondary }}>
                                    Supports CSV format • Multiple files allowed
                                </p>
                            </div>
                        </div>
                        <input
                            type="file"
                            accept=".csv"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </label>

                    {selectedFiles.length > 0 && (
                        <div className="mb-6 p-4 rounded-xl border" style={{ backgroundColor: colors.secondary, borderColor: colors.border }}>
                            <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                                <FileText className="w-4 h-4" />
                                Selected Files
                            </p>
                            <ul className="space-y-2">
                                {selectedFiles.map((file, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm p-2 rounded-lg" style={{ backgroundColor: colors.cardBg, color: colors.textPrimary }}>
                                        <FileText className="w-4 h-4 text-blue-400" />
                                        {file.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {selectedFiles.length > 0 && (
                        <>
                            {/* UNIFIED FILTER FEATURES */}
                            <div className="mb-8 p-6 rounded-xl border" style={{ backgroundColor: colors.secondary + "40", borderColor: colors.border }}>
                                <div className="flex items-center gap-2 mb-4">
                                    <Filter className="w-5 h-5 text-blue-400" />
                                    <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>Unified Filters & Features</h3>
                                </div>

                                <div className="space-y-4">
                                    {/* Email Validation */}
                                    <div className="flex flex-col gap-2 p-3 rounded-lg border transition-all hover:bg-white/5" style={{ borderColor: colors.border }}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={featureConfig.email_validation.enabled}
                                                    onChange={() => toggleFeature('email_validation')}
                                                    className="w-5 h-5 rounded accent-blue-500"
                                                />
                                                <span style={{ color: colors.textPrimary }} className="font-medium">Email Validation</span>
                                            </div>
                                            {featureConfig.email_validation.enabled && (
                                                <select
                                                    value={featureConfig.email_validation.column}
                                                    onChange={(e) => updateFeatureConfig('email_validation', 'column', e.target.value)}
                                                    className="p-2 rounded-lg text-sm border focus:ring-2 focus:ring-blue-500 outline-none"
                                                    style={{ backgroundColor: colors.cardBg, color: colors.textPrimary, borderColor: colors.border }}
                                                >
                                                    <option value="">Select Column</option>
                                                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            )}
                                        </div>
                                    </div>

                                    {/* Phone Validation */}
                                    <div className="flex flex-col gap-2 p-3 rounded-lg border transition-all hover:bg-white/5" style={{ borderColor: colors.border }}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={featureConfig.phone_validation.enabled}
                                                    onChange={() => toggleFeature('phone_validation')}
                                                    className="w-5 h-5 rounded accent-blue-500"
                                                />
                                                <span style={{ color: colors.textPrimary }} className="font-medium">Phone Validation</span>
                                            </div>
                                            {featureConfig.phone_validation.enabled && (
                                                <div className="flex gap-2">
                                                    <select
                                                        value={featureConfig.phone_validation.column}
                                                        onChange={(e) => updateFeatureConfig('phone_validation', 'column', e.target.value)}
                                                        className="p-2 rounded-lg text-sm border focus:ring-2 focus:ring-blue-500 outline-none"
                                                        style={{ backgroundColor: colors.cardBg, color: colors.textPrimary, borderColor: colors.border }}
                                                    >
                                                        <option value="">Select Column</option>
                                                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Duplicates */}
                                    <div className="flex flex-col gap-2 p-3 rounded-lg border transition-all hover:bg-white/5" style={{ borderColor: colors.border }}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={featureConfig.duplicates.enabled}
                                                    onChange={() => toggleFeature('duplicates')}
                                                    className="w-5 h-5 rounded accent-blue-500"
                                                />
                                                <span style={{ color: colors.textPrimary }} className="font-medium">Check Duplicates</span>
                                            </div>
                                            {featureConfig.duplicates.enabled && (
                                                <div className="mt-3 p-4 rounded-xl border bg-black/40 w-full" style={{ borderColor: colors.border }}>
                                                    <div className="flex justify-between items-center mb-3">
                                                        <p className="text-xs font-bold uppercase tracking-wider opacity-70" style={{ color: colors.textSecondary }}>Detection Strategy</p>
                                                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                                            {featureConfig.duplicates.columns.length === 0 ? "ALL COLUMNS" : `${featureConfig.duplicates.columns.length} SELECTED`}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                        {columns.map(c => (
                                                            <label key={c} className="flex items-center gap-2 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-all border border-transparent hover:border-white/5 active:scale-95">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={featureConfig.duplicates.columns.includes(c)}
                                                                    onChange={(e) => {
                                                                        const currentCols = Array.isArray(featureConfig.duplicates.columns) ? featureConfig.duplicates.columns : [];
                                                                        const newCols = e.target.checked
                                                                            ? [...currentCols, c]
                                                                            : currentCols.filter(col => col !== c);
                                                                        updateFeatureConfig('duplicates', 'columns', newCols);
                                                                    }}
                                                                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                                                                />
                                                                <span className="text-[11px] truncate text-gray-200 font-medium" title={c}>{c}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    {featureConfig.duplicates.columns.length === 0 && (
                                                        <div className="mt-3 flex items-center gap-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                                                            <AlertCircle className="w-3 h-3 text-yellow-500" />
                                                            <p className="text-[10px] text-yellow-500/80 italic">Heuristic mode active: Checking across all data points for matches.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Missing Field Check */}
                                    <div className="flex flex-col gap-2 p-3 rounded-lg border transition-all hover:bg-white/5" style={{ borderColor: colors.border }}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={featureConfig.missing_values.enabled}
                                                    onChange={() => toggleFeature('missing_values')}
                                                    className="w-5 h-5 rounded accent-blue-500"
                                                />
                                                <span style={{ color: colors.textPrimary }} className="font-medium">Missing Field Check</span>
                                            </div>
                                            {/* Could add specific columns selector later, but user request implies just 'missing field check' */}
                                        </div>
                                    </div>

                                    {/* Title Inconsistency Check */}
                                    <div className="flex flex-col gap-2 p-3 rounded-lg border transition-all hover:bg-white/5" style={{ borderColor: colors.border }}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={featureConfig.consistency_check.enabled}
                                                    onChange={() => toggleFeature('consistency_check')}
                                                    className="w-5 h-5 rounded accent-blue-500"
                                                />
                                                <span style={{ color: colors.textPrimary }} className="font-medium">Title Inconsistency Check (LLM)</span>
                                            </div>
                                            {featureConfig.consistency_check.enabled && (
                                                <select
                                                    value={featureConfig.consistency_check.column}
                                                    onChange={(e) => updateFeatureConfig('consistency_check', 'column', e.target.value)}
                                                    className="p-2 rounded-lg text-sm border focus:ring-2 focus:ring-blue-500 outline-none"
                                                    style={{ backgroundColor: colors.cardBg, color: colors.textPrimary, borderColor: colors.border }}
                                                >
                                                    <option value="">Select Column (e.g. Job Title)</option>
                                                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mode Selection */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <button
                                    onClick={() => setMode('clean')}
                                    className="relative p-4 rounded-xl font-semibold transition-all border-2"
                                    style={{
                                        backgroundColor: mode === 'clean' ? colors.accent1 : colors.secondary,
                                        borderColor: mode === 'clean' ? colors.accent1 : colors.border,
                                        color: mode === 'clean' ? 'white' : colors.textPrimary,
                                    }}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Sparkles className="w-5 h-5" />
                                        <span>Clean & Validate</span>
                                    </div>
                                    <p className="text-xs mt-1 opacity-80">
                                        Automated data cleaning
                                    </p>
                                </button>
                                <button
                                    onClick={() => setMode('review')}
                                    className="relative p-4 rounded-xl font-semibold transition-all border-2"
                                    style={{
                                        backgroundColor: mode === 'review' ? colors.accent2 : colors.secondary,
                                        borderColor: mode === 'review' ? colors.accent2 : colors.border,
                                        color: mode === 'review' ? 'white' : colors.textPrimary,
                                    }}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <BarChart3 className="w-5 h-5" />
                                        <span>Review Mode</span>
                                    </div>
                                    <p className="text-xs mt-1 opacity-80">
                                        Manual verification
                                    </p>
                                </button>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={mode === 'clean' ? handleAnalyseAndClean : handleReview}
                                disabled={loading}
                                className="w-full text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{
                                    background: mode === 'clean'
                                        ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                                        : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                                }}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : mode === 'clean' ? (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Analyze & Clean Data
                                    </>
                                ) : (
                                    <>
                                        <BarChart3 className="w-5 h-5" />
                                        Send to Review Queue
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>

                {/* Analysis Dashboard */}
                {rows.length > 0 && (
                    <div className="mb-12">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Data Quality Dashboard
                            </h2>
                            <p className="mb-6" style={{ color: colors.textSecondary }}>
                                Comprehensive analysis of data integrity and validation metrics
                            </p>


                        </div>
                        <HeptagonChart data={chartData} />
                    </div>
                )}

                {/* DETAILED ANALYSIS BREAKDOWN */}
                {summaryStats && (
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: colors.textPrimary }}>
                                <Zap className="w-6 h-6 text-yellow-400" />
                                Detailed Analysis Breakdown
                            </h2>
                            <p className="text-sm italic" style={{ color: colors.textSecondary }}>Click a card to view detailed records below</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

                            {/* Email Validation Card */}
                            {summaryStats.email_validation && (
                                <div
                                    onClick={() => setActiveDetailView('EMAIL')}
                                    className={`relative overflow-hidden p-6 rounded-2xl border transition-all cursor-pointer hover:shadow-lg hover:scale-[1.02] ${activeDetailView === 'EMAIL' ? 'ring-2 ring-blue-500 shadow-blue-500/20' : ''}`}
                                    style={{ backgroundColor: '#000000', borderColor: activeDetailView === 'EMAIL' ? '#3b82f6' : colors.border }}
                                >
                                    <img src="/lion.png" alt="Lion" className="absolute top-2 right-2 w-12 h-12 opacity-50 pointer-events-none object-contain" />
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <h3 className="font-bold text-lg text-white">Email Validation</h3>
                                        </div>
                                        <div className="space-y-3 pointer-events-none">
                                            <div className="flex justify-between text-sm">
                                                <span style={{ color: colors.textSecondary }}>Column: {summaryStats.email_validation.column}</span>
                                            </div>
                                            <div className="space-y-2 mt-4">
                                                {Object.entries(summaryStats.email_validation.breakdown).map(([status, count]) => (
                                                    <div key={status} className="flex justify-between items-center text-sm p-2 rounded bg-white/5">
                                                        <span className={
                                                            status === 'VALID' ? 'text-green-500 font-semibold' :
                                                                status === 'MISSING' ? 'text-red-500 font-semibold' :
                                                                    'text-yellow-500 font-semibold'
                                                        }>{status}</span>
                                                        <span className="font-mono font-bold text-white">{count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <button className="mt-4 w-full py-2 bg-blue-500/10 text-blue-500 rounded-lg text-sm font-semibold hover:bg-blue-500/20 transition-colors">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Phone Validation Card */}
                            {summaryStats.phone_validation && (
                                <div
                                    onClick={() => setActiveDetailView('PHONE')}
                                    className={`relative overflow-hidden p-6 rounded-2xl border transition-all cursor-pointer hover:shadow-lg hover:scale-[1.02] ${activeDetailView === 'PHONE' ? 'ring-2 ring-green-500 shadow-green-500/20' : ''}`}
                                    style={{ backgroundColor: '#000000', borderColor: activeDetailView === 'PHONE' ? '#10b981' : colors.border }}
                                >
                                    <img src="/lion.png" alt="Lion" className="absolute top-2 right-2 w-12 h-12 opacity-50 pointer-events-none object-contain" />
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                                                <Phone className="w-5 h-5" />
                                            </div>
                                            <h3 className="font-bold text-lg text-white">Phone Validation</h3>
                                        </div>
                                        <div className="space-y-3 pointer-events-none">
                                            <div className="flex justify-between text-sm">
                                                <span style={{ color: colors.textSecondary }}>Column: {summaryStats.phone_validation.column}</span>
                                                <span style={{ color: colors.textSecondary }}>Region: {summaryStats.phone_validation.region}</span>
                                            </div>
                                            <div className="space-y-2 mt-4">
                                                {Object.entries(summaryStats.phone_validation.breakdown).map(([status, count]) => (
                                                    <div key={status} className="flex justify-between items-center text-sm p-2 rounded bg-white/5">
                                                        <span className={
                                                            status === 'VALID' ? 'text-green-500 font-semibold' :
                                                                'text-red-500 font-semibold'
                                                        }>{status}</span>
                                                        <span className="font-mono font-bold text-white">{count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <button className="mt-4 w-full py-2 bg-green-500/10 text-green-500 rounded-lg text-sm font-semibold hover:bg-green-500/20 transition-colors">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Duplicates Card */}
                            {summaryStats.duplicates && (
                                <div
                                    onClick={() => setActiveDetailView('DUPLICATES')}
                                    className={`relative overflow-hidden p-6 rounded-2xl border transition-all cursor-pointer hover:shadow-lg hover:scale-[1.02] ${activeDetailView === 'DUPLICATES' ? 'ring-2 ring-purple-500 shadow-purple-500/20' : ''}`}
                                    style={{ backgroundColor: '#000000', borderColor: activeDetailView === 'DUPLICATES' ? '#a855f7' : colors.border }}
                                >
                                    <img src="/lion.png" alt="Lion" className="absolute top-2 right-2 w-12 h-12 opacity-50 pointer-events-none object-contain" />
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                                <Copy className="w-5 h-5" />
                                            </div>
                                            <h3 className="font-bold text-lg text-white">Duplicates Found</h3>
                                        </div>
                                        <div className="flex flex-col items-center justify-center py-6 pointer-events-none">
                                            <span className="text-5xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                                                {summaryStats.duplicates.count}
                                            </span>
                                            <p className="text-sm mt-2 opacity-75" style={{ color: colors.textSecondary }}>Duplicate Rows Detected</p>
                                            <p className="text-xs mt-1 opacity-50 text-gray-400">Checked based on: {Array.isArray(summaryStats.duplicates.columns_checked) ? summaryStats.duplicates.columns_checked.join(", ") : "All Columns"}</p>
                                        </div>
                                        <button className="mt-4 w-full py-2 bg-purple-500/10 text-purple-500 rounded-lg text-sm font-semibold hover:bg-purple-500/20 transition-colors">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Missing Values Card */}
                            {summaryStats.missing_values && (
                                <div
                                    onClick={() => setActiveDetailView('MISSING')}
                                    className={`relative overflow-hidden p-6 rounded-2xl border transition-all cursor-pointer hover:shadow-lg hover:scale-[1.02] col-span-1 md:col-span-2 lg:col-span-1 ${activeDetailView === 'MISSING' ? 'ring-2 ring-orange-500 shadow-orange-500/20' : ''}`}
                                    style={{ backgroundColor: '#000000', borderColor: activeDetailView === 'MISSING' ? '#f97316' : colors.border }}
                                >
                                    <img src="/lion.png" alt="Lion" className="absolute top-2 right-2 w-12 h-12 opacity-50 pointer-events-none object-contain" />
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                                <AlertCircle className="w-5 h-5" />
                                            </div>
                                            <h3 className="font-bold text-lg text-white">Missing Values</h3>
                                        </div>
                                        <div className="space-y-3 pointer-events-none">
                                            <p className="text-sm font-bold text-orange-500">Total Empty Cells: {summaryStats.missing_values.total_missing_cells}</p>
                                            <div className="h-64 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                                                {Object.entries(summaryStats.missing_values.by_column).map(([col, count]) => (
                                                    <div key={col} className="flex justify-between items-center text-xs p-2 rounded bg-white/5 border border-transparent hover:border-orange-500/30">
                                                        <span className="font-medium truncate max-w-[150px] text-white" title={col}>{col}</span>
                                                        <span className="font-mono font-bold text-orange-400">{count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <button className="mt-4 w-full py-2 bg-orange-500/10 text-orange-500 rounded-lg text-sm font-semibold hover:bg-orange-500/20 transition-colors">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Semantic Inconsistency Card */}
                            {summaryStats.consistency_check && (
                                <div
                                    onClick={() => setActiveDetailView('CONSISTENCY')}
                                    className={`relative overflow-hidden p-6 rounded-2xl border transition-all cursor-pointer hover:shadow-lg hover:scale-[1.02] ${activeDetailView === 'CONSISTENCY' ? 'ring-2 ring-pink-500 shadow-pink-500/20' : ''}`}
                                    style={{ backgroundColor: '#000000', borderColor: activeDetailView === 'CONSISTENCY' ? '#ec4899' : colors.border }}
                                >
                                    <img src="/lion.png" alt="Lion" className="absolute top-2 right-2 w-12 h-12 opacity-50 pointer-events-none object-contain" />
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
                                                <Sparkles className="w-5 h-5" />
                                            </div>
                                            <h3 className="font-bold text-lg text-white">Title Inconsistency Check (LLM)</h3>
                                        </div>
                                        <div className="space-y-3 pointer-events-none">
                                            <div className="flex justify-between text-sm">
                                                <span style={{ color: colors.textSecondary }}>Column: {summaryStats.consistency_check.column}</span>
                                            </div>

                                            {/* Breakdown similar to Email/Phone */}
                                            <div className="space-y-2 mt-4">
                                                <div className="flex justify-between items-center text-sm p-2 rounded bg-white/5">
                                                    <span className="text-red-500 font-semibold uppercase">Inconsistent</span>
                                                    <span className="font-mono font-bold text-white">{summaryStats.consistency_check.inconsistencies_found}</span>
                                                </div>
                                            </div>

                                            <div className="rounded-lg overflow-hidden border mt-4" style={{ borderColor: colors.border }}>
                                                <table className="w-full text-left text-xs">
                                                    <thead className="bg-white/5 text-white">
                                                        <tr>
                                                            <th className="p-2 font-semibold">Original</th>
                                                            <th className="p-2 font-semibold text-right">Unified</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y" style={{ divideColor: colors.border }}>
                                                        {Object.entries(summaryStats.consistency_check.mappings).slice(0, 3).map(([original, united], idx) => (
                                                            <tr key={idx} className="hover:bg-white/5">
                                                                <td className="p-2 truncate max-w-[100px]" title={original} style={{ color: colors.textSecondary }}>{original}</td>
                                                                <td className="p-2 text-right font-medium text-green-400 truncate max-w-[100px]" title={united}>{united}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveDetailView('CONSISTENCY');
                                                }}
                                                className="flex-1 py-2 bg-pink-500/10 text-pink-500 rounded-lg text-sm font-semibold hover:bg-pink-500/20 transition-colors"
                                            >
                                                View Details
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Extract job titles from rows
                                                    const titleKey = Object.keys(rows[0] || {}).find(k =>
                                                        k.toLowerCase().includes('job') ||
                                                        k.toLowerCase().includes('title')
                                                    );
                                                    if (titleKey) {
                                                        const titles = [...new Set(rows.map(r => r[titleKey]).filter(t => t && String(t).trim()))];
                                                        navigate(`/job-analysis?titles=${encodeURIComponent(JSON.stringify(titles))}`);
                                                    }
                                                }}
                                                className="flex-1 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-1"
                                            >
                                                <Briefcase className="w-4 h-4" />
                                                Full Analysis
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>


                    </div>
                )}

                {/* Download Button */}
                {rows.length > 0 && cleanedData && (
                    <div className="flex justify-center mb-8">
                        <button
                            onClick={downloadCleanedCSV}
                            className="text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all hover:shadow-xl active:scale-95 flex items-center gap-2"
                            style={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                            }}
                        >
                            <Download className="w-5 h-5" />
                            Download Cleaned Data
                        </button>
                    </div>
                )}

                {/* DETAIL TABLE VIEW - MOVED HERE */}
                {activeDetailView && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-300 mb-12">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <ChevronDown className="w-5 h-5 text-blue-500" />
                                <h3 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                                    {activeDetailView === 'EMAIL' && "Invalid / Missing Email Records"}
                                    {activeDetailView === 'PHONE' && "Invalid Phone Number Records"}
                                    {activeDetailView === 'DUPLICATES' && "Duplicate Rows Detected"}
                                    {activeDetailView === 'MISSING' && "Rows with Missing Values"}
                                    {activeDetailView === 'CONSISTENCY' && "Title Inconsistencies Detected"}
                                </h3>
                            </div>

                            {/* Filter Dropdown */}
                            {(activeDetailView === 'EMAIL' || activeDetailView === 'PHONE') && uniqueStatuses.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4" style={{ color: colors.textSecondary }} />
                                    <select
                                        value={detailFilter}
                                        onChange={(e) => setDetailFilter(e.target.value)}
                                        className="p-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-blue-500"
                                        style={{ backgroundColor: colors.secondary, color: colors.textPrimary, borderColor: colors.border }}
                                    >
                                        <option value="ALL">All Statuses</option>
                                        {uniqueStatuses.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl overflow-hidden border shadow-2xl" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
                            <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 z-10 shadow-sm" style={{ backgroundColor: colors.secondary }}>
                                        <tr className="text-white">
                                            <th className="p-4 font-semibold text-sm w-20">Row</th>
                                            {activeDetailView === 'EMAIL' && (
                                                <>
                                                    <th className="p-4 font-semibold text-sm">Company</th>
                                                    <th className="p-4 font-semibold text-sm">Email</th>
                                                    <th className="p-4 font-semibold text-sm">Status</th>
                                                </>
                                            )}
                                            {activeDetailView === 'PHONE' && (
                                                <>
                                                    <th className="p-4 font-semibold text-sm">Phone</th>
                                                    <th className="p-4 font-semibold text-sm">Cleaned</th>
                                                    <th className="p-4 font-semibold text-sm">Status</th>
                                                </>
                                            )}
                                            {activeDetailView === 'DUPLICATES' && (
                                                <>
                                                    <th className="p-4 font-semibold text-sm">Company</th>
                                                    <th className="p-4 font-semibold text-sm">Email</th>
                                                    <th className="p-4 font-semibold text-sm">Phone</th>
                                                </>
                                            )}
                                            {activeDetailView === 'MISSING' && (
                                                <>
                                                    <th className="p-4 font-semibold text-sm">Data Preview</th>
                                                    <th className="p-4 font-semibold text-sm">Missing Count</th>
                                                </>
                                            )}
                                            {activeDetailView === 'CONSISTENCY' && (
                                                <>
                                                    <th className="p-4 font-semibold text-sm">Original Value</th>
                                                    <th className="p-4 font-semibold text-sm">Unified Value</th>
                                                    <th className="p-4 font-semibold text-sm">Action</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y" style={{ divideColor: colors.border }}>
                                        {filteredDetailRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center opacity-50 text-white">
                                                    No records found matching filter.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredDetailRows.map((r, i) => (
                                                <tr key={i} className="hover:bg-white/5 transition-colors text-white">
                                                    <td className="p-4 font-mono text-xs opacity-70">#{r.row}</td>

                                                    {/* EMAIL */}
                                                    {activeDetailView === 'EMAIL' && (
                                                        <>
                                                            <td className="p-4 font-medium text-sm text-white">{r.company_name || r.Company || r['Company Name'] || '-'}</td>
                                                            <td className="p-4 text-sm font-mono text-white">
                                                                {r[summaryStats?.email_validation?.column] || <span className="text-red-500 opacity-80 font-bold">MISSING</span>}
                                                            </td>
                                                            <td className="p-4">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${r.email_status === 'MISSING'
                                                                    ? 'bg-red-500/20 text-red-500'
                                                                    : 'bg-yellow-500/20 text-yellow-500'
                                                                    }`}>
                                                                    {r.email_status}
                                                                </span>
                                                            </td>
                                                        </>
                                                    )}

                                                    {/* PHONE */}
                                                    {activeDetailView === 'PHONE' && (
                                                        <>
                                                            <td className="p-4 text-sm font-mono text-white">
                                                                {r[summaryStats?.phone_validation?.column] || <span className="text-red-500 opacity-80 font-bold">MISSING</span>}
                                                            </td>
                                                            <td className="p-4 text-sm font-mono text-green-400">{r.formatted_phone || '-'}</td>
                                                            <td className="p-4">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${r.phone_status === 'MISSING'
                                                                    ? 'bg-red-500/20 text-red-500'
                                                                    : 'bg-yellow-500/20 text-yellow-500'
                                                                    }`}>
                                                                    {r.phone_status}
                                                                </span>
                                                            </td>
                                                        </>
                                                    )}

                                                    {/* DUPLICATES */}
                                                    {activeDetailView === 'DUPLICATES' && (
                                                        <>
                                                            <td className="p-4 text-sm text-white">{r.company_name || r.Company || r['Company Name'] || '-'}</td>
                                                            <td className="p-4 text-sm text-white">{r[summaryStats?.email_validation?.column] || r.email || '-'}</td>
                                                            <td className="p-4 text-sm text-white">{r[summaryStats?.phone_validation?.column] || r.phone || '-'}</td>
                                                        </>
                                                    )}

                                                    {/* MISSING */}
                                                    {activeDetailView === 'MISSING' && (
                                                        <>
                                                            <td className="p-4 text-xs font-mono opacity-80 max-w-md truncate text-white">
                                                                {JSON.stringify(r).slice(0, 100)}...
                                                            </td>
                                                            <td className="p-4 font-bold text-orange-500">{r.missing_count} fields empty</td>
                                                        </>
                                                    )}

                                                    {/* CONSISTENCY */}
                                                    {activeDetailView === 'CONSISTENCY' && (
                                                        <>
                                                            <td className="p-4 text-sm text-red-400 line-through decoration-red-500/50">
                                                                {r[summaryStats?.consistency_check?.column]}
                                                            </td>
                                                            <td className="p-4 text-sm text-green-400">
                                                                {r[`${summaryStats?.consistency_check?.column}_unified`]}
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="flex gap-2">
                                                                    {consistencyDecisions[r.row] === 'accept' ? (
                                                                        <span className="text-green-500 font-bold text-xs border border-green-500 px-2 py-1 rounded">ACCEPTED</span>
                                                                    ) : consistencyDecisions[r.row] === 'reject' ? (
                                                                        <span className="text-red-500 font-bold text-xs border border-red-500 px-2 py-1 rounded">REJECTED</span>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handleConsistencyDecision(r.row, 'accept')}
                                                                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded shadow transition-all"
                                                                        >
                                                                            Accept
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>

                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Modal */}
            {
                showJobAnalysis && (
                    <JobAnalysisModal
                        rows={rows}
                        onClose={() => setShowJobAnalysis(false)}
                        colors={colors}
                    />
                )
            }

            {/* AI Chatbot with Data Context */}
            <Chatbot
                dataContext={{
                    total_rows: rows.length,
                    summary_stats: summaryStats,
                    has_data: rows.length > 0
                }}
            />
        </div >
    );
};
export default DataQualityCopilot;
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, X, ChevronDown, ChevronUp, Search, Upload, FileText, Download, Sparkles, CheckCircle2, XCircle, AlertCircle, Zap, Database, BarChart3, Filter } from 'lucide-react';
import HeptagonChart from '../components/HeptagonChart';

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

    const summary = React.useMemo(() => {
        if (!rows) return [];
        const summaryDict = {};
        rows.forEach(row => {
            const role = row.role_function || "Other";
            const title = row.jobtitle || row["Job Title"] || row.job_title || "Unknown";

            if (!summaryDict[role]) summaryDict[role] = { titles: new Set(), count: 0 };
            summaryDict[role].titles.add(title);
            summaryDict[role].count++;
        });

        return Object.entries(summaryDict).map(([role, data]) => ({
            job_function: role,
            job_titles: Array.from(data.titles).sort(),
            count: data.count
        })).sort((a, b) => b.count - a.count);
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
            <div className="w-full max-w-4xl max-h-[85vh] m-4 rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: colors.border, background: `linear-gradient(135deg, ${colors.secondary}, ${colors.cardBg})` }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                            <Briefcase className="w-6 h-6 text-white" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>Job Function Analysis</h2>
                            <p className="text-sm" style={{ color: colors.textSecondary }}>Normalized job titles and role classifications</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-6 h-6" style={{ color: colors.textSecondary }} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Search */}
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.textSecondary }} />
                        <input
                            type="text"
                            placeholder="Search job titles or functions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            style={{
                                backgroundColor: colors.secondary,
                                borderColor: colors.border,
                                color: colors.textPrimary
                            }}
                        />
                    </div>

                    <div className="space-y-3">
                        {filteredSummary.length === 0 ? (
                            <div className="text-center py-16">
                                <Database className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: colors.textSecondary }} />
                                <p style={{ color: colors.textSecondary }}>No job data found. Ensure "Job Title" column exists.</p>
                            </div>
                        ) : (
                            filteredSummary.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="rounded-xl border overflow-hidden transition-all duration-300 hover:shadow-lg"
                                    style={{
                                        backgroundColor: colors.secondary,
                                        borderColor: colors.border
                                    }}
                                >
                                    <button
                                        onClick={() => toggleCategory(item.job_function)}
                                        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20">
                                                <Briefcase className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold" style={{ color: colors.textPrimary }}>
                                                    {item.job_function}
                                                </h3>
                                                <span className="text-xs" style={{ color: colors.textSecondary }}>
                                                    {item.job_titles.length} unique {item.job_titles.length === 1 ? 'title' : 'titles'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full">
                                                {item.count}
                                            </span>
                                            {expandedCategory === item.job_function ?
                                                <ChevronUp className="w-5 h-5" style={{ color: colors.textSecondary }} /> :
                                                <ChevronDown className="w-5 h-5" style={{ color: colors.textSecondary }} />
                                            }
                                        </div>
                                    </button>
                                    {expandedCategory === item.job_function && (
                                        <div className="border-t p-4 grid grid-cols-1 md:grid-cols-2 gap-2" style={{ borderColor: colors.border, backgroundColor: colors.cardBg }}>
                                            {item.job_titles.map((title, tIdx) => (
                                                <div key={tIdx} className="text-sm px-3 py-2.5 rounded-lg border" style={{ backgroundColor: colors.secondary, borderColor: colors.border, color: colors.textPrimary }}>
                                                    {title}
                                                </div>
                                            ))}
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
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cleanedData, setCleanedData] = useState(null);
    const [showJobAnalysis, setShowJobAnalysis] = useState(false);
    const { getColors } = useTheme();
    const colors = getColors();
    const { filters } = useFilters();
    const navigate = useNavigate();

    const handleAnalyseAndClean = async () => {
        if (selectedFiles.length === 0) return;

        setLoading(true);
        const allRows = [];

        try {
            // Process each file sequentially
            for (const file of selectedFiles) {
                const formData = new FormData();
                formData.append("file", file);

                const res = await fetch("http://localhost:8000/api/upload-csv", {
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
            acc[filename].push(row);
            return acc;
        }, {});

        // Download each file separately
        Object.entries(fileGroups).forEach(([filename, rows]) => {
            const headers = ['row', 'company_name', 'email', 'email_status', 'suggested_email', 'confidence', 'phone', 'phone_status', 'formatted_phone'];
            const csvContent = [
                headers.join(','),
                ...rows.map(r => [
                    r.row,
                    `"${r.company_name || ''}"`,
                    `"${r.email || ''}"`,
                    r.email_status,
                    `"${r.email_fix || ''}"`,
                    r.email_confidence,
                    `"${r.phone || ''}"`,
                    r.phone_status,
                    `"${r.formatted_phone || ''}"`
                ].join(','))
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

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFiles(Array.from(e.target.files));
            setRows([]);
            setCleanedData(null);
        }
    };

    const chartData = useMemo(() => {
        if (!rows || rows.length === 0) return [];

        const totalRows = rows.length;
        const uniqueEmails = new Set(rows.map(r => r.email).filter(e => e));
        const potentialDuplicates = totalRows - uniqueEmails.size;
        const invalidCount = rows.filter(r => r.email_status !== 'VALID' || r.phone_status !== 'VALID').length;
        const suggestedCount = rows.filter(r => r.email_fix).length;
        const mapJobTitles = 0;
        const totalConfidence = rows.reduce((acc, r) => acc + (r.email_confidence || 0), 0);
        const avgConfidence = totalRows ? Math.round((totalConfidence / totalRows) * 100) : 0;
        const validRows = rows.filter(r => r.email_status === 'VALID' && r.phone_status === 'VALID').length;
        const qualityScore = Math.round((validRows / totalRows) * 100);
        const issueCount = invalidCount;

        return [
            { label: "Potential Duplicates", value: potentialDuplicates },
            { label: "Invalid / Missing Fields", value: invalidCount },
            { label: "Suggested Corrections", value: suggestedCount },
            { label: "Map Job Titles", value: mapJobTitles },
            { label: "Confidence Level", value: avgConfidence + "%" },
            { label: "Data Quality", value: qualityScore + "%" },
            { label: "Count of Issues", value: issueCount }
        ];
    }, [rows]);

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

                            <button
                                onClick={() => setShowJobAnalysis(true)}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg transition-all"
                            >
                                <Briefcase className="w-5 h-5" />
                                View Job Analysis
                            </button>
                        </div>
                        <HeptagonChart data={chartData} />
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

                {/* Results Table */}
                {rows.length > 0 && (
                    <>
                        <div className="mb-4 flex justify-end">
                            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all hover:shadow-md" style={{ backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.textPrimary }}>
                                <Filter className="w-5 h-5 text-blue-400" />
                                <span className="font-semibold text-sm">Filters</span>
                            </button>
                        </div>

                        <div
                            className="rounded-2xl overflow-hidden border"
                            style={{
                                backgroundColor: colors.cardBg,
                                borderColor: colors.border,
                                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                            }}
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr style={{ backgroundColor: colors.secondary }}>
                                            {selectedFiles.length > 1 && (
                                                <th className="p-4 font-semibold text-sm" style={{ color: colors.textSecondary }}>
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4" />
                                                        File
                                                    </div>
                                                </th>
                                            )}
                                            <th className="p-4 font-semibold text-sm" style={{ color: colors.textSecondary }}>Row</th>
                                            <th className="p-4 font-semibold text-sm" style={{ color: colors.textSecondary }}>Company</th>
                                            <th className="p-4 font-semibold text-sm" style={{ color: colors.textSecondary }}>Email</th>
                                            <th className="p-4 font-semibold text-sm" style={{ color: colors.textSecondary }}>Status</th>
                                            <th className="p-4 font-semibold text-sm" style={{ color: colors.textSecondary }}>AI Suggestion</th>
                                            <th className="p-4 font-semibold text-sm" style={{ color: colors.textSecondary }}>Phone Status</th>
                                            <th className="p-4 font-semibold text-sm" style={{ color: colors.textSecondary }}>Formatted Phone</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRows.map((r, i) => (
                                            <tr
                                                key={i}
                                                className="transition-colors duration-200 hover:bg-white/5"
                                                style={{
                                                    borderBottom: `1px solid ${colors.border}`,
                                                }}
                                            >
                                                {selectedFiles.length > 1 && (
                                                    <td className="p-4 text-xs" style={{ color: colors.textSecondary }}>
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="w-3 h-3" />
                                                            {r.filename}
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="p-4 font-mono text-sm" style={{ color: colors.textSecondary }}>#{r.row}</td>
                                                <td className="p-4 font-medium" style={{ color: colors.textPrimary }}>{r.company_name || "-"}</td>
                                                <td className="p-4 font-mono text-sm" style={{ color: colors.textPrimary }}>{r.email || "-"}</td>
                                                <td className="p-4">
                                                    <span
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                                                        style={{
                                                            backgroundColor: r.email_status === "VALID" ? '#10b98120' : '#ef444420',
                                                            color: r.email_status === "VALID" ? '#10b981' : '#ef4444',
                                                        }}
                                                    >
                                                        {r.email_status === "VALID" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                                        {r.email_status}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {r.email_fix ? (
                                                        <div className="flex flex-col p-3 rounded-lg border" style={{ backgroundColor: '#3b82f620', borderColor: '#3b82f640' }}>
                                                            <div className="font-semibold flex items-center gap-2 text-sm" style={{ color: '#3b82f6' }}>
                                                                <Sparkles className="w-4 h-4" />
                                                                {r.email_fix}
                                                            </div>
                                                            <span className="text-xs mt-1" style={{ color: '#3b82f6aa' }}>
                                                                Confidence: {Math.round(r.email_confidence * 100)}%
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: colors.textSecondary }}>-</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                                                        style={{
                                                            backgroundColor: r.phone_status === "VALID" ? '#10b98120' : '#ef444420',
                                                            color: r.phone_status === "VALID" ? '#10b981' : '#ef4444',
                                                        }}
                                                    >
                                                        {r.phone_status === "VALID" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                                        {r.phone_status}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-mono text-sm" style={{ color: colors.textPrimary }}>
                                                    {r.formatted_phone || "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
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
        </div >
    );
};

export default DataQualityCopilot;
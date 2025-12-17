import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import HeptagonChart from "../components/HeptagonChart";
import UnifiedFilterButton from "../components/UnifiedFilterButton";
import { useFilters } from "../context/FilterContext";
import {
    ArrowLeft,
    Check,
    X,
    Edit3,
    Filter,
    Download,
    AlertCircle,
    CheckCircle,
    Clock,
    Search,
    ChevronDown,
    ChevronUp,
    Save,
    RefreshCw,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import { getReviewData, applyReviewChanges } from "../services/api";

// Status badge component
const StatusBadge = ({ status, colors }) => {
    const statusConfig = {
        auto_accepted: {
            label: "Auto-Accepted",
            bg: "#10b98120",
            color: "#10b981",
            icon: CheckCircle,
        },
        needs_review: {
            label: "Needs Review",
            bg: "#f5920520",
            color: "#f59205",
            icon: AlertCircle,
        },
        rejected: {
            label: "Rejected",
            bg: "#ef444420",
            color: "#ef4444",
            icon: X,
        },
        accepted: {
            label: "Accepted",
            bg: "#10b98120",
            color: "#10b981",
            icon: Check,
        },
        overridden: {
            label: "Manual Fix",
            bg: "#8b5cf620",
            color: "#8b5cf6",
            icon: Edit3,
        },
    };

    const config = statusConfig[status] || statusConfig.needs_review;
    const Icon = config.icon;

    return (
        <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: config.bg, color: config.color }}
        >
            <Icon className="w-3 h-3" />
            {config.label}
        </span>
    );
};

// Confidence bar component
const ConfidenceBar = ({ confidence, colors }) => {
    const getConfidenceColor = (conf) => {
        if (conf >= 0.7) return "#10b981";
        if (conf >= 0.5) return "#f59205";
        return "#ef4444";
    };

    return (
        <div className="flex items-center gap-2">
            <div
                className="h-2 rounded-full w-16"
                style={{ backgroundColor: `${colors.textSecondary}20` }}
            >
                <div
                    className="h-full rounded-full transition-all"
                    style={{
                        width: `${confidence * 100}%`,
                        backgroundColor: getConfidenceColor(confidence),
                    }}
                />
            </div>
            <span
                className="text-xs font-mono"
                style={{ color: getConfidenceColor(confidence) }}
            >
                {(confidence * 100).toFixed(0)}%
            </span>
        </div>
    );
};

export default function ReviewUI() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get("session");
    const { getColors } = useTheme();
    const { user } = useUser();
    const colors = getColors();

    // Unified filters from context
    const { filters: unifiedFilters } = useFilters();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [reviewData, setReviewData] = useState(null);
    const [changes, setChanges] = useState([]);
    const [filteredChanges, setFilteredChanges] = useState([]);
    const [appliedResult, setAppliedResult] = useState(null);

    // Filter state
    const [filters, setFilters] = useState({
        showLowConfidence: false,
        status: "all",
        searchQuery: "",
    });

    // Edit modal state
    const [editModal, setEditModal] = useState({
        open: false,
        change: null,
        value: "",
        reason: "",
    });

    // Expanded rows for viewing full content
    const [expandedRows, setExpandedRows] = useState(new Set());

    useEffect(() => {
        if (sessionId) {
            loadReviewData();
        }
    }, [sessionId]);

    useEffect(() => {
        applyFilters();
    }, [changes, filters, unifiedFilters]);

    const loadReviewData = async () => {
        try {
            setLoading(true);
            const response = await getReviewData(sessionId);
            setReviewData(response.data);

            // Initialize changes with pending actions
            const changesWithActions = response.data.changes.map((change) => ({
                ...change,
                action: change.status === "auto_accepted" ? "accept" : null,
                override_value: null,
                reason: null,
            }));
            setChanges(changesWithActions);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to load review data");
        } finally {
            setLoading(false);
        }
    };



    const applyFilters = () => {
        let filtered = [...changes];

        // Only apply if at least one filter is active
        const hasActiveFilters = Object.values(unifiedFilters).some(Boolean);

        if (hasActiveFilters) {
            filtered = filtered.filter(c => {
                const ft = c.fix_type;

                if (unifiedFilters.duplicate && ft === 'duplicate') return true;
                if (unifiedFilters.email && ft === 'email') return true;
                if (unifiedFilters.phone && ft === 'phone') return true;
                if (unifiedFilters.unify && ft === 'company') return true;
                if (unifiedFilters.job_normalization && ft === 'job_title') return true;
                if (unifiedFilters.fake_domain && ft === 'domain') return true;

                return false;
            });
        }

        // Search filter (local state)
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            filtered = filtered.filter(
                (c) =>
                    (c.original_value && c.original_value.toLowerCase().includes(query)) ||
                    (c.cleaned_value && c.cleaned_value.toLowerCase().includes(query)) ||
                    (c.column && c.column.toLowerCase().includes(query))
            );
        }

        setFilteredChanges(filtered);
    };

    const chartData = useMemo(() => {
        if (!changes || changes.length === 0) return [];

        const totalChanges = changes.length;

        // 1. Potential Duplicates (Placeholder)
        const potentialDuplicates = 0;

        // 2. Invalid / Missing Fields (Pending actions)
        const invalidCount = changes.filter(c => c.status === 'needs_review').length;

        // 3. Suggested Corrections (Total suggestions)
        const suggestedCount = totalChanges;

        // 4. Map Job Titles
        const mapJobTitles = changes.filter(c => c.fix_type === 'job_title').length;

        // 5. Confidence Level
        const totalConfidence = changes.reduce((acc, c) => acc + (c.confidence || 0), 0);
        const avgConfidence = totalChanges ? Math.round((totalConfidence / totalChanges) * 100) : 0;

        // 6. Data Quality Score (Percentage of accepted/handled changes)
        const handledCount = changes.filter(c => c.status === 'accepted' || c.status === 'auto_accepted' || c.status === 'overridden').length;
        const qualityScore = Math.round((handledCount / totalChanges) * 100);

        // 7. Count of Issues
        const issueCount = invalidCount;

        return [
            { label: "Potential Duplicates", value: potentialDuplicates },
            { label: "Pending Reviews", value: invalidCount },
            { label: "Total Suggestions", value: suggestedCount },
            { label: "Map Job Titles", value: mapJobTitles },
            { label: "Avg Confidence", value: avgConfidence + "%" },
            { label: "Review Progress", value: qualityScore + "%" },
            { label: "Remaining Issues", value: issueCount }
        ];
    }, [changes]);

    const handleAccept = (changeId) => {
        setChanges((prev) =>
            prev.map((c) =>
                c.id === changeId
                    ? { ...c, action: "accept", status: "accepted" }
                    : c
            )
        );
    };

    const handleReject = (changeId) => {
        setChanges((prev) =>
            prev.map((c) =>
                c.id === changeId
                    ? { ...c, action: "reject", status: "rejected" }
                    : c
            )
        );
    };

    const handleEdit = (change) => {
        setEditModal({
            open: true,
            change,
            value: change.override_value || change.cleaned_value,
            reason: change.reason || "",
        });
    };

    const handleSaveEdit = () => {
        if (!editModal.change) return;

        setChanges((prev) =>
            prev.map((c) =>
                c.id === editModal.change.id
                    ? {
                        ...c,
                        action: "override",
                        status: "overridden",
                        override_value: editModal.value,
                        reason: editModal.reason,
                    }
                    : c
            )
        );
        setEditModal({ open: false, change: null, value: "", reason: "" });
    };

    const handleAcceptAll = () => {
        setChanges((prev) =>
            prev.map((c) =>
                c.status === "needs_review"
                    ? { ...c, action: "accept", status: "accepted" }
                    : c
            )
        );
    };

    const handleRejectAll = () => {
        setChanges((prev) =>
            prev.map((c) =>
                c.status === "needs_review"
                    ? { ...c, action: "reject", status: "rejected" }
                    : c
            )
        );
    };

    const handleApplyChanges = async () => {
        try {
            setSaving(true);

            const changesToApply = changes
                .filter((c) => c.action)
                .map((c) => ({
                    change_id: c.id,
                    action: c.action,
                    override_value: c.override_value,
                    reason: c.reason,
                    modified_by: user?.email || "anonymous",
                }));

            const response = await applyReviewChanges(sessionId, changesToApply);

            // Store the result for display and download
            setAppliedResult(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to apply changes");
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadCleaned = () => {
        if (!appliedResult || !appliedResult.cleaned_file_path) {
            alert("No cleaned file available");
            return;
        }

        // Trigger download
        const downloadUrl = `http://localhost:8000${appliedResult.cleaned_file_path.replace('data/cleaned/', '/files/download/')}`;
        window.open(downloadUrl, '_blank');
    };

    const toggleRowExpand = (changeId) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(changeId)) {
                next.delete(changeId);
            } else {
                next.add(changeId);
            }
            return next;
        });
    };

    const getFixTypeLabel = (type) => {
        const labels = {
            company: "Company",
            domain: "Domain",
            email: "Email",
            phone: "Phone",
            job_title: "Job Title",
        };
        return labels[type] || type;
    };

    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: colors.primary }}
            >
                <div className="text-center">
                    <RefreshCw
                        className="w-12 h-12 animate-spin mx-auto mb-4"
                        style={{ color: colors.accent1 }}
                    />
                    <p style={{ color: colors.textSecondary }}>
                        Loading review data...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: colors.primary }}
            >
                <div
                    className="text-center p-8 rounded-3xl"
                    style={{
                        backgroundColor: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                    }}
                >
                    <AlertCircle
                        className="w-16 h-16 mx-auto mb-4"
                        style={{ color: "#ef4444" }}
                    />
                    <h2
                        className="text-xl font-bold mb-2"
                        style={{ color: colors.textPrimary }}
                    >
                        Error Loading Review
                    </h2>
                    <p className="mb-4" style={{ color: colors.textSecondary }}>
                        {error}
                    </p>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="px-6 py-3 rounded-xl text-white font-medium"
                        style={{
                            background: `linear-gradient(135deg, ${colors.accent1}, ${colors.accent2})`,
                        }}
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const pendingReviewCount = changes.filter(
        (c) => c.status === "needs_review" && !c.action
    ).length;
    const acceptedCount = changes.filter(
        (c) => c.status === "accepted" || c.status === "auto_accepted"
    ).length;
    const rejectedCount = changes.filter((c) => c.status === "rejected").length;
    const overriddenCount = changes.filter(
        (c) => c.status === "overridden"
    ).length;

    return (
        <div
            className="min-h-screen transition-colors duration-500"
            style={{ backgroundColor: colors.primary }}
        >
            {/* Background pattern */}
            <div className="fixed inset-0 opacity-5 pointer-events-none">
                <img src="/logo.jpg" alt="" className="w-full h-full object-cover" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="p-2 rounded-xl transition-all hover:scale-105"
                            style={{
                                backgroundColor: colors.cardBg,
                                border: `1px solid ${colors.border}`,
                            }}
                        >
                            <ArrowLeft
                                className="w-5 h-5"
                                style={{ color: colors.textSecondary }}
                            />
                        </button>
                        <div>
                            <h1
                                className="text-2xl font-bold"
                                style={{ color: colors.textPrimary }}
                            >
                                Human-in-the-Loop Review
                            </h1>
                            <p style={{ color: colors.textSecondary }}>
                                Review and approve AI-suggested changes
                            </p>
                        </div>
                    </div>

                    {!appliedResult ? (
                        <button
                            onClick={handleApplyChanges}
                            disabled={saving || pendingReviewCount > 0}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: `linear-gradient(135deg, ${colors.accent1}, ${colors.accent2})`,
                            }}
                        >
                            {saving ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Applying...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Apply Changes ({acceptedCount + overriddenCount})
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-green-500">
                                <CheckCircle className="w-6 h-6" />
                                <span className="font-medium">Changes Applied!</span>
                            </div>
                            <button
                                onClick={handleDownloadCleaned}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-all hover:scale-105"
                                style={{
                                    background: `linear-gradient(135deg, ${colors.accent1}, ${colors.accent2})`,
                                }}
                            >
                                <Download className="w-5 h-5" />
                                Download Cleaned CSV
                            </button>
                        </div>
                    )}
                </div>

                {/* Interactive Chart */}
                <div className="mb-8">
                    <HeptagonChart data={chartData} colors={colors} />
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        {
                            label: "Pending Review",
                            value: pendingReviewCount,
                            color: "#f59205",
                            icon: Clock,
                        },
                        {
                            label: "Accepted",
                            value: acceptedCount,
                            color: "#10b981",
                            icon: CheckCircle,
                        },
                        {
                            label: "Rejected",
                            value: rejectedCount,
                            color: "#ef4444",
                            icon: X,
                        },
                        {
                            label: "Manual Fixes",
                            value: overriddenCount,
                            color: "#8b5cf6",
                            icon: Edit3,
                        },
                    ].map((stat, idx) => (
                        <div
                            key={idx}
                            className="p-4 rounded-2xl transition-colors duration-500"
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
                                    <stat.icon
                                        className="w-5 h-5"
                                        style={{ color: stat.color }}
                                    />
                                </div>
                                <div>
                                    <p
                                        className="text-2xl font-bold"
                                        style={{ color: stat.color }}
                                    >
                                        {stat.value}
                                    </p>
                                    <p
                                        className="text-xs"
                                        style={{ color: colors.textSecondary }}
                                    >
                                        {stat.label}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Unified Filtering */}
                <div
                    className="p-4 rounded-2xl mb-6 flex flex-wrap items-center gap-4"
                    style={{
                        backgroundColor: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                    }}
                >
                    <UnifiedFilterButton columns={reviewData?.columns || []} />

                    <div className="flex items-center gap-2">
                        {/* Status Filter */}
                        <select
                            value={filters.status}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    status: e.target.value,
                                }))
                            }
                            className="pl-3 pr-8 py-2 rounded-xl text-sm focus:outline-none appearance-none"
                            style={{
                                backgroundColor: colors.secondary,
                                border: `1px solid ${colors.border}`,
                                color: colors.textPrimary,
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                backgroundPosition: `right 0.5rem center`,
                                backgroundRepeat: `no-repeat`,
                                backgroundSize: `1.5em 1.5em`,
                            }}
                        >
                            <option value="all">All Status</option>
                            <option value="needs_review">Needs Review</option>
                            <option value="auto_accepted">Auto-Accepted</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                            <option value="overridden">Manual Fix</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Low Confidence Toggle */}
                        <button
                            onClick={() =>
                                setFilters((prev) => ({
                                    ...prev,
                                    showLowConfidence: !prev.showLowConfidence,
                                }))
                            }
                            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${filters.showLowConfidence ? "ring-2" : ""
                                }`}
                            style={{
                                backgroundColor: filters.showLowConfidence
                                    ? `${colors.accent1}20`
                                    : colors.secondary,
                                color: filters.showLowConfidence
                                    ? colors.accent1
                                    : colors.textSecondary,
                                border: `1px solid ${colors.border}`,
                                ringColor: colors.accent1,
                            }}
                        >
                            Low Confidence
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>Search:</span>
                        <input
                            type="text"
                            placeholder="Search values..."
                            value={filters.searchQuery}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    searchQuery: e.target.value,
                                }))
                            }
                            className="pl-3 pr-4 py-2 rounded-xl text-sm focus:outline-none w-40 focus:w-60 transition-all"
                            style={{
                                backgroundColor: colors.secondary,
                                border: `1px solid ${colors.border}`,
                                color: colors.textPrimary,
                            }}
                        />
                    </div>

                    {/* Bulk Actions */}
                    <div className="flex gap-2 ml-auto">
                        <button
                            onClick={handleAcceptAll}
                            className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
                            style={{
                                backgroundColor: "#10b98120",
                                color: "#10b981",
                                border: "1px solid #10b98140",
                            }}
                        >
                            Accept All Pending
                        </button>
                        <button
                            onClick={handleRejectAll}
                            className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
                            style={{
                                backgroundColor: "#ef444420",
                                color: "#ef4444",
                                border: "1px solid #ef444440",
                            }}
                        >
                            Reject All Pending
                        </button>
                    </div>
                </div>

                {/* Changes Table */}
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                        backgroundColor: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                    }}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr
                                    style={{
                                        backgroundColor: colors.secondary,
                                        borderBottom: `1px solid ${colors.border}`,
                                    }}
                                >
                                    <th
                                        className="px-4 py-3 text-left text-xs font-semibold"
                                        style={{ color: colors.textSecondary }}
                                    >
                                        Row
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-xs font-semibold"
                                        style={{ color: colors.textSecondary }}
                                    >
                                        Column
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-xs font-semibold"
                                        style={{ color: colors.textSecondary }}
                                    >
                                        Fix Type
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-xs font-semibold"
                                        style={{ color: colors.textSecondary }}
                                    >
                                        Original
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-xs font-semibold"
                                        style={{ color: colors.textSecondary }}
                                    >
                                        Suggested
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-xs font-semibold"
                                        style={{ color: colors.textSecondary }}
                                    >
                                        Confidence
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-xs font-semibold"
                                        style={{ color: colors.textSecondary }}
                                    >
                                        Status
                                    </th>
                                    <th
                                        className="px-4 py-3 text-right text-xs font-semibold"
                                        style={{ color: colors.textSecondary }}
                                    >
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredChanges.map((change, idx) => (
                                    <tr
                                        key={change.id}
                                        className="transition-colors"
                                        style={{
                                            borderBottom: `1px solid ${colors.border}`,
                                            backgroundColor:
                                                idx % 2 === 0
                                                    ? "transparent"
                                                    : colors.secondary + "40",
                                        }}
                                    >
                                        <td
                                            className="px-4 py-3 text-sm font-mono"
                                            style={{ color: colors.textSecondary }}
                                        >
                                            {change.row_index + 1}
                                        </td>
                                        <td
                                            className="px-4 py-3 text-sm font-medium"
                                            style={{ color: colors.textPrimary }}
                                        >
                                            {change.column}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className="px-2 py-1 rounded-lg text-xs font-medium"
                                                style={{
                                                    backgroundColor: `${colors.accent2}20`,
                                                    color: colors.accent2,
                                                }}
                                            >
                                                {getFixTypeLabel(change.fix_type)}
                                            </span>
                                        </td>
                                        <td
                                            className="px-4 py-3 text-sm max-w-[200px]"
                                            style={{ color: colors.textSecondary }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="truncate"
                                                    title={change.original_value}
                                                >
                                                    {change.original_value}
                                                </span>
                                                {change.original_value.length > 30 && (
                                                    <button
                                                        onClick={() =>
                                                            toggleRowExpand(change.id)
                                                        }
                                                    >
                                                        {expandedRows.has(change.id) ? (
                                                            <ChevronUp
                                                                className="w-4 h-4"
                                                                style={{
                                                                    color: colors.accent1,
                                                                }}
                                                            />
                                                        ) : (
                                                            <ChevronDown
                                                                className="w-4 h-4"
                                                                style={{
                                                                    color: colors.accent1,
                                                                }}
                                                            />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td
                                            className="px-4 py-3 text-sm max-w-[200px]"
                                            style={{ color: colors.accent1 }}
                                        >
                                            <span
                                                className="truncate block"
                                                title={
                                                    change.override_value ||
                                                    change.cleaned_value
                                                }
                                            >
                                                {change.override_value ||
                                                    change.cleaned_value}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <ConfidenceBar
                                                confidence={change.confidence}
                                                colors={colors}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge
                                                status={change.status}
                                                colors={colors}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleAccept(change.id)}
                                                    className="p-2 rounded-lg transition-all hover:scale-110"
                                                    style={{
                                                        backgroundColor: "#10b98120",
                                                    }}
                                                    title="Accept"
                                                >
                                                    <Check
                                                        className="w-4 h-4"
                                                        style={{ color: "#10b981" }}
                                                    />
                                                </button>
                                                <button
                                                    onClick={() => handleReject(change.id)}
                                                    className="p-2 rounded-lg transition-all hover:scale-110"
                                                    style={{
                                                        backgroundColor: "#ef444420",
                                                    }}
                                                    title="Reject"
                                                >
                                                    <X
                                                        className="w-4 h-4"
                                                        style={{ color: "#ef4444" }}
                                                    />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(change)}
                                                    className="p-2 rounded-lg transition-all hover:scale-110"
                                                    style={{
                                                        backgroundColor: "#8b5cf620",
                                                    }}
                                                    title="Edit/Override"
                                                >
                                                    <Edit3
                                                        className="w-4 h-4"
                                                        style={{ color: "#8b5cf6" }}
                                                    />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredChanges.length === 0 && (
                        <div className="text-center py-12">
                            <p style={{ color: colors.textSecondary }}>
                                No changes match your filters
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div
                        className="w-full max-w-lg mx-4 p-6 rounded-3xl shadow-2xl"
                        style={{
                            backgroundColor: colors.cardBg,
                            border: `1px solid ${colors.border}`,
                        }}
                    >
                        <h3
                            className="text-xl font-bold mb-4"
                            style={{ color: colors.textPrimary }}
                        >
                            Manual Override
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label
                                    className="block text-sm font-medium mb-2"
                                    style={{ color: colors.textSecondary }}
                                >
                                    Original Value
                                </label>
                                <p
                                    className="p-3 rounded-xl text-sm"
                                    style={{
                                        backgroundColor: colors.secondary,
                                        color: colors.textSecondary,
                                    }}
                                >
                                    {editModal.change?.original_value}
                                </p>
                            </div>

                            <div>
                                <label
                                    className="block text-sm font-medium mb-2"
                                    style={{ color: colors.textSecondary }}
                                >
                                    New Value
                                </label>
                                <input
                                    type="text"
                                    value={editModal.value}
                                    onChange={(e) =>
                                        setEditModal((prev) => ({
                                            ...prev,
                                            value: e.target.value,
                                        }))
                                    }
                                    className="w-full p-3 rounded-xl text-sm"
                                    style={{
                                        backgroundColor: colors.secondary,
                                        border: `1px solid ${colors.border}`,
                                        color: colors.textPrimary,
                                    }}
                                />
                            </div>

                            <div>
                                <label
                                    className="block text-sm font-medium mb-2"
                                    style={{ color: colors.textSecondary }}
                                >
                                    Reason for Change (optional)
                                </label>
                                <textarea
                                    value={editModal.reason}
                                    onChange={(e) =>
                                        setEditModal((prev) => ({
                                            ...prev,
                                            reason: e.target.value,
                                        }))
                                    }
                                    rows={3}
                                    placeholder="Why are you making this change?"
                                    className="w-full p-3 rounded-xl text-sm resize-none"
                                    style={{
                                        backgroundColor: colors.secondary,
                                        border: `1px solid ${colors.border}`,
                                        color: colors.textPrimary,
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() =>
                                    setEditModal({
                                        open: false,
                                        change: null,
                                        value: "",
                                        reason: "",
                                    })
                                }
                                className="flex-1 py-3 rounded-xl font-medium transition-all"
                                style={{
                                    backgroundColor: colors.secondary,
                                    color: colors.textSecondary,
                                    border: `1px solid ${colors.border}`,
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="flex-1 py-3 rounded-xl font-medium text-white transition-all"
                                style={{
                                    background: `linear-gradient(135deg, ${colors.accent1}, ${colors.accent2})`,
                                }}
                            >
                                Save Override
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

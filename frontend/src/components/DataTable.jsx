import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Search, Loader2, AlertCircle } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function DataTable({
    data = [],
    columns = [],
    isLoading = false,
    pagination = null, // { page, pageSize, total, onPageChange }
    title = "Data View"
}) {
    const { getColors } = useTheme();
    const colors = getColors();
    const [searchTerm, setSearchTerm] = useState("");

    // Auto-detect columns if not provided
    const displayColumns = columns.length > 0
        ? columns
        : (data.length > 0 ? Object.keys(data[0]).filter(k => !k.startsWith('_')) : []);

    const filteredData = pagination
        ? data
        : data.filter(row =>
            Object.values(row).some(val =>
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );

    const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1;

    // Helper to find suggestion for a specific cell
    const getSuggestion = (row, col) => {
        if (!row._suggestions || !Array.isArray(row._suggestions)) return null;
        return row._suggestions.find(s => s.column === col);
    };

    return (
        <div
            className="rounded-2xl overflow-hidden shadow-lg transition-colors duration-500"
            style={{
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.border}`
            }}
        >
            {/* Header */}
            <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center gap-4"
                style={{ borderColor: colors.border }}
            >
                <h3 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                    {title}
                </h3>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.textSecondary }} />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl outline-none transition-all"
                        style={{
                            backgroundColor: colors.primary,
                            color: colors.textPrimary,
                            border: `1px solid ${colors.border}`
                        }}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr style={{ backgroundColor: `${colors.primary}80` }}>
                            {displayColumns.map((col) => (
                                <th
                                    key={col}
                                    className="px-6 py-4 font-semibold whitespace-nowrap"
                                    style={{ color: colors.textSecondary }}
                                >
                                    {col.replace(/_/g, " ").toUpperCase()}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y" style={{ divideColor: colors.border }}>
                        {isLoading ? (
                            <tr>
                                <td colSpan={displayColumns.length} className="px-6 py-12 text-center">
                                    <div className="flex justify-center flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.accent1 }} />
                                        <p style={{ color: colors.textSecondary }}>Loading data...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={displayColumns.length} className="px-6 py-12 text-center">
                                    <p style={{ color: colors.textSecondary }}>No data found</p>
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((row, idx) => (
                                <tr
                                    key={idx}
                                    className="transition-colors hover:bg-opacity-50"
                                    style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : `${colors.primary}40` }}
                                >
                                    {displayColumns.map((col) => {
                                        const suggestion = getSuggestion(row, col);
                                        const hasIssue = !!suggestion;

                                        return (
                                            <td
                                                key={`${idx}-${col}`}
                                                className="px-6 py-3 whitespace-nowrap relative group"
                                                style={{
                                                    color: hasIssue ? colors.accent2 : colors.textPrimary,
                                                    backgroundColor: hasIssue ? `${colors.accent2}10` : 'transparent'
                                                }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? '-')}
                                                    {hasIssue && (
                                                        <AlertCircle className="w-4 h-4" color={colors.accent2} />
                                                    )}
                                                </div>

                                                {/* Tooltip for Suggestion */}
                                                {hasIssue && (
                                                    <div
                                                        className="absolute z-50 invisible group-hover:visible bg-black text-white text-xs rounded-lg p-3 shadow-xl bottom-full left-1/2 -translate-x-1/2 mb-2 w-64"
                                                        style={{ border: `1px solid ${colors.accent2}` }}
                                                    >
                                                        <p className="font-bold mb-1" style={{ color: colors.accent2 }}>Issue: {suggestion.type}</p>
                                                        <div className="grid grid-cols-[auto,1fr] gap-x-2 gap-y-1">
                                                            <span className="text-gray-400">Original:</span>
                                                            <span className="line-through">{suggestion.original}</span>
                                                            <span className="text-gray-400">Suggested:</span>
                                                            <span className="text-green-400 font-mono">{suggestion.suggested}</span>
                                                        </div>
                                                        <div className="mt-2 text-[10px] text-gray-500">
                                                            Confidence: {(suggestion.confidence * 100).toFixed(0)}%
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {pagination && !isLoading && pagination.total > 0 && (
                <div
                    className="p-4 border-t flex items-center justify-between"
                    style={{ borderColor: colors.border }}
                >
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                        Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} entries
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
                            disabled={pagination.page === 1}
                            className="p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: colors.primary,
                                color: colors.textPrimary,
                                border: `1px solid ${colors.border}`
                            }}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <span className="text-sm font-medium px-2" style={{ color: colors.textPrimary }}>
                            Page {pagination.page} of {totalPages}
                        </span>

                        <button
                            onClick={() => pagination.onPageChange(Math.min(totalPages, pagination.page + 1))}
                            disabled={pagination.page === totalPages}
                            className="p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: colors.primary,
                                color: colors.textPrimary,
                                border: `1px solid ${colors.border}`
                            }}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

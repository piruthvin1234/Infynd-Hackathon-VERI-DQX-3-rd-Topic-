import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const DuplicateColumnSelector = ({ isOpen, onClose, onApply, columns = [], selectedColumns = [] }) => {
    const { getColors } = useTheme();
    const colors = getColors();
    const [localSelected, setLocalSelected] = useState(new Set(selectedColumns));
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setLocalSelected(new Set(selectedColumns));
            setError(null);
        }
    }, [isOpen, selectedColumns]);

    const toggleColumn = (col) => {
        const newSet = new Set(localSelected);
        if (newSet.has(col)) {
            newSet.delete(col);
        } else {
            newSet.add(col);
        }
        setLocalSelected(newSet);
        if (newSet.size > 0) setError(null);
    };

    const handleApply = () => {
        if (localSelected.size === 0) {
            setError("Please select at least one column");
            return;
        }
        onApply(Array.from(localSelected));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div
                className="w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden transform transition-all scale-100"
                style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
            >
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: colors.border, backgroundColor: colors.secondary }}>
                    <div>
                        <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>Duplicate Detection Settings</h3>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>Select columns to check for duplicates</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10 transition-colors">
                        <X className="w-5 h-5" style={{ color: colors.textSecondary }} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    {/* Columns Grid */}
                    <div className="space-y-2">
                        {columns && columns.length > 0 ? (
                            columns.map((col) => (
                                <label
                                    key={col}
                                    onClick={() => toggleColumn(col)}
                                    className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all duration-200 ${localSelected.has(col) ? 'border-blue-500 bg-blue-500/10' : 'hover:bg-black/5'}`}
                                    style={{ borderColor: localSelected.has(col) ? undefined : colors.border }}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${localSelected.has(col) ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}>
                                        {localSelected.has(col) && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="font-medium" style={{ color: colors.textPrimary }}>{col}</span>
                                </label>
                            ))
                        ) : (
                            <p className="text-center py-4" style={{ color: colors.textSecondary }}>No columns available</p>
                        )}
                    </div>

                    {error && (
                        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center font-medium">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t flex justify-end gap-3" style={{ borderColor: colors.border, backgroundColor: colors.primary }}>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg font-medium transition-colors hover:bg-black/5"
                        style={{ color: colors.textSecondary }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        className="px-6 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all transform active:scale-95"
                    >
                        Apply Duplicate Filter
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DuplicateColumnSelector;

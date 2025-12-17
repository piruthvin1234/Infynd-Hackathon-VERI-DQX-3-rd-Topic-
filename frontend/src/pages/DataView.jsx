import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Database, CheckCircle, Table, Play } from "lucide-react";
import DataTable from "../components/DataTable";
import { getFileReviewData, getFileCleanedData, finalizeFileCleaning } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import UnifiedFilterButton from "../components/UnifiedFilterButton";
import { useFilters } from "../context/FilterContext";

export default function DataView() {
    const { fileId } = useParams();
    const navigate = useNavigate();
    const { getColors } = useTheme();
    const colors = getColors();

    const [activeTab, setActiveTab] = useState("raw"); // "raw", "cleaned"
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, pageSize: 50, total: 0 });
    const [fileStatus, setFileStatus] = useState("analyzed");
    const { getActiveFiltersJSON, filters } = useFilters();

    const fetchData = async (page = 1) => {
        setLoading(true);
        try {
            const activeFiltersJSON = getActiveFiltersJSON();
            let res;
            if (activeTab === "raw") {
                res = await getFileReviewData(fileId, page, pagination.pageSize, activeFiltersJSON);
            } else {
                res = await getFileCleanedData(fileId, page, pagination.pageSize, activeFiltersJSON);
            }

            setData(res.data.data);
            setPagination(prev => ({ ...prev, page, total: res.data.total }));
        } catch (err) {
            console.error("Failed to fetch data", err);
            // If cleaned data not found, likely not cleaned yet
            if (activeTab === "cleaned" && err.response?.status === 404) {
                alert("Cleaned data not available yet. Please run cleaning first.");
                setActiveTab("raw");
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData(1);
    }, [activeTab, filters]);

    const handlePageChange = (newPage) => {
        fetchData(newPage);
    };

    const handleFinalize = async () => {
        if (!confirm("This will apply all accepted changes and generate the final dataset. Continue?")) return;
        setLoading(true);
        try {
            await finalizeFileCleaning(fileId);
            alert("File cleaned successfully!");
            setActiveTab("cleaned");
            setFileStatus("cleaned");
        } catch (err) {
            alert("Cleaning failed: " + (err.response?.data?.detail || err.message));
        }
        setLoading(false);
    };

    const tabs = [
        { id: "raw", label: "Raw & Review", icon: Database },
        { id: "cleaned", label: "Cleaned Data", icon: Table },
    ];

    return (
        <div className="min-h-screen p-6 transition-colors duration-500"
            style={{ backgroundColor: colors.primary }}
        >
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:bg-opacity-20 hover:bg-gray-500"
                        style={{ color: colors.textSecondary }}
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>

                    <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                        Data Inspector
                    </h1>

                    <div className="flex items-center gap-4">
                        <UnifiedFilterButton columns={data.length > 0 ? Object.keys(data[0]) : []} />
                    </div>
                </div>

                {/* Controls & Tabs */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl border"
                    style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>

                    <div className="flex bg-gray-100/10 p-1 rounded-xl">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "shadow-sm" : "hover:bg-gray-500/10"
                                    }`}
                                style={{
                                    backgroundColor: activeTab === tab.id ? colors.accent1 : "transparent",
                                    color: activeTab === tab.id ? "#fff" : colors.textSecondary
                                }}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleFinalize}
                        className="flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-white transition-all transform hover:scale-105"
                        style={{
                            background: `linear-gradient(135deg, ${colors.accent2}, ${colors.accent1})`,
                            opacity: activeTab === "cleaned" ? 0.5 : 1,
                            cursor: activeTab === "cleaned" ? "default" : "pointer"
                        }}
                        disabled={activeTab === "cleaned"}
                    >
                        {activeTab === "cleaned" ? <CheckCircle className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        {activeTab === "cleaned" ? "Cleaning Complete" : "Finalize & Clean"}
                    </button>
                </div>

                {/* Data Table */}
                <DataTable
                    data={data}
                    isLoading={loading}
                    pagination={{
                        page: pagination.page,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        onPageChange: handlePageChange
                    }}
                    title={activeTab === 'raw' ? "Original Data with Suggestions" : "Final Cleaned Dataset"}
                />
            </div>
        </div>
    );
}

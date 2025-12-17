import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FolderOpen,
    Plus,
    MoreVertical,
    Trash2,
    Edit3,
    TrendingUp,
    TrendingDown,
    Minus,
    Clock,
    FileText,
    BarChart3,
    ArrowLeft,
    Settings,
    RefreshCw,
    Search,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import { getProjects, createProject, deleteProject } from "../services/api";
import ThemeSelector from "../components/ThemeSelector";
import Header from "../components/Header";

// Quality Score Badge
const QualityBadge = ({ score }) => {
    if (score === null || score === undefined) {
        return (
            <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600">
                No runs yet
            </span>
        );
    }

    const getColor = (s) => {
        if (s >= 90) return { bg: "#10b98120", text: "#10b981" };
        if (s >= 70) return { bg: "#f5920520", text: "#f59205" };
        return { bg: "#ef444420", text: "#ef4444" };
    };

    const colors = getColor(score);
    return (
        <span
            className="text-sm font-bold px-3 py-1 rounded-full"
            style={{ backgroundColor: colors.bg, color: colors.text }}
        >
            {score.toFixed(1)}%
        </span>
    );
};

// Create Project Modal
const CreateProjectModal = ({ isOpen, onClose, onSubmit, colors }) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        await onSubmit({ name: name.trim(), description: description.trim() });
        setLoading(false);
        setName("");
        setDescription("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div
                className="w-full max-w-md mx-4 p-6 rounded-3xl shadow-2xl"
                style={{
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                }}
            >
                <h2
                    className="text-xl font-bold mb-4"
                    style={{ color: colors.textPrimary }}
                >
                    Create New Project
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: colors.textSecondary }}
                        >
                            Project Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Q4 Campaign Data"
                            className="w-full p-3 rounded-xl"
                            style={{
                                backgroundColor: colors.secondary,
                                border: `1px solid ${colors.border}`,
                                color: colors.textPrimary,
                            }}
                            required
                        />
                    </div>

                    <div>
                        <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: colors.textSecondary }}
                        >
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description..."
                            rows={3}
                            className="w-full p-3 rounded-xl resize-none"
                            style={{
                                backgroundColor: colors.secondary,
                                border: `1px solid ${colors.border}`,
                                color: colors.textPrimary,
                            }}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
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
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="flex-1 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-50"
                            style={{
                                background: `linear-gradient(135deg, ${colors.accent1}, ${colors.accent2})`,
                            }}
                        >
                            {loading ? (
                                <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
                            ) : (
                                "Create Project"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function Projects() {
    const navigate = useNavigate();
    const { getColors } = useTheme();
    const { user } = useUser();
    const colors = getColors();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [menuOpen, setMenuOpen] = useState(null);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            setLoading(true);
            // For now, use user ID 1 (this should come from auth context)
            const userId = user?.id || 1;
            const response = await getProjects(userId);
            setProjects(response.data.projects || []);
        } catch (err) {
            console.error("Failed to load projects:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (projectData) => {
        try {
            const userId = user?.id || 1;
            await createProject(projectData, userId);
            loadProjects();
        } catch (err) {
            console.error("Failed to create project:", err);
            alert("Failed to create project. Please try again.");
        }
    };

    const handleDeleteProject = async (projectId) => {
        if (!window.confirm("Are you sure you want to delete this project?")) return;

        try {
            await deleteProject(projectId);
            loadProjects();
        } catch (err) {
            console.error("Failed to delete project:", err);
            alert("Failed to delete project. Please try again.");
        }
        setMenuOpen(null);
    };

    const filteredProjects = projects.filter(
        (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div
            className="min-h-screen transition-colors duration-500"
            style={{ backgroundColor: colors.primary }}
        >
            {/* Background pattern */}
            <div className="fixed inset-0 opacity-5 pointer-events-none">
                <img src="/logo.jpg" alt="" className="w-full h-full object-cover" />
            </div>

            {/* Global Header */}
            <Header />

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
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
                                className="text-3xl font-bold"
                                style={{ color: colors.textPrimary }}
                            >
                                Projects
                            </h1>
                            <p style={{ color: colors.textSecondary }}>
                                Manage your data quality workspaces
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-medium transition-all hover:scale-105"
                        style={{
                            background: `linear-gradient(135deg, ${colors.accent1}, ${colors.accent2})`,
                        }}
                    >
                        <Plus className="w-5 h-5" />
                        New Project
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                            style={{ color: colors.textSecondary }}
                        />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl"
                            style={{
                                backgroundColor: colors.cardBg,
                                border: `1px solid ${colors.border}`,
                                color: colors.textPrimary,
                            }}
                        />
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw
                            className="w-10 h-10 animate-spin"
                            style={{ color: colors.accent1 }}
                        />
                    </div>
                ) : filteredProjects.length === 0 ? (
                    /* Empty State */
                    <div
                        className="text-center py-20 rounded-3xl"
                        style={{
                            backgroundColor: colors.cardBg,
                            border: `1px solid ${colors.border}`,
                        }}
                    >
                        <FolderOpen
                            className="w-20 h-20 mx-auto mb-4"
                            style={{ color: colors.textSecondary }}
                        />
                        <h2
                            className="text-xl font-bold mb-2"
                            style={{ color: colors.textPrimary }}
                        >
                            {searchQuery ? "No Projects Found" : "No Projects Yet"}
                        </h2>
                        <p className="mb-6" style={{ color: colors.textSecondary }}>
                            {searchQuery
                                ? "Try a different search term"
                                : "Create your first project to start tracking data quality"}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium"
                                style={{
                                    background: `linear-gradient(135deg, ${colors.accent1}, ${colors.accent2})`,
                                }}
                            >
                                <Plus className="w-5 h-5" />
                                Create First Project
                            </button>
                        )}
                    </div>
                ) : (
                    /* Projects Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map((project) => (
                            <div
                                key={project.id}
                                className="rounded-2xl p-6 transition-all hover:shadow-xl cursor-pointer group relative"
                                style={{
                                    backgroundColor: colors.cardBg,
                                    border: `1px solid ${colors.border}`,
                                }}
                                onClick={() => navigate(`/projects/${project.id}`)}
                            >
                                {/* Menu Button */}
                                <button
                                    className="absolute top-4 right-4 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ backgroundColor: colors.secondary }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuOpen(menuOpen === project.id ? null : project.id);
                                    }}
                                >
                                    <MoreVertical
                                        className="w-4 h-4"
                                        style={{ color: colors.textSecondary }}
                                    />
                                </button>

                                {/* Dropdown Menu */}
                                {menuOpen === project.id && (
                                    <div
                                        className="absolute top-12 right-4 z-10 rounded-xl shadow-lg overflow-hidden"
                                        style={{
                                            backgroundColor: colors.cardBg,
                                            border: `1px solid ${colors.border}`,
                                        }}
                                    >
                                        <button
                                            className="flex items-center gap-2 px-4 py-2 w-full text-left text-sm hover:bg-gray-100"
                                            style={{ color: colors.textPrimary }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/projects/${project.id}/settings`);
                                            }}
                                        >
                                            <Settings className="w-4 h-4" />
                                            Settings
                                        </button>
                                        <button
                                            className="flex items-center gap-2 px-4 py-2 w-full text-left text-sm hover:bg-red-50"
                                            style={{ color: "#ef4444" }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteProject(project.id);
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                )}

                                {/* Project Icon */}
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                                    style={{
                                        background: `linear-gradient(135deg, ${colors.accent1}30, ${colors.accent2}30)`,
                                    }}
                                >
                                    <FolderOpen
                                        className="w-6 h-6"
                                        style={{ color: colors.accent1 }}
                                    />
                                </div>

                                {/* Project Name */}
                                <h3
                                    className="text-lg font-bold mb-1 truncate"
                                    style={{ color: colors.textPrimary }}
                                >
                                    {project.name}
                                </h3>

                                {/* Description */}
                                {project.description && (
                                    <p
                                        className="text-sm mb-4 line-clamp-2"
                                        style={{ color: colors.textSecondary }}
                                    >
                                        {project.description}
                                    </p>
                                )}

                                {/* Stats */}
                                <div className="flex items-center justify-between mt-4 pt-4 border-t"
                                    style={{ borderColor: colors.border }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1">
                                            <FileText
                                                className="w-4 h-4"
                                                style={{ color: colors.textSecondary }}
                                            />
                                            <span
                                                className="text-sm"
                                                style={{ color: colors.textSecondary }}
                                            >
                                                {project.run_count} runs
                                            </span>
                                        </div>
                                    </div>

                                    <QualityBadge score={project.latest_quality_score} />
                                </div>

                                {/* Last Updated */}
                                <div className="flex items-center gap-1 mt-3">
                                    <Clock
                                        className="w-3 h-3"
                                        style={{ color: colors.textSecondary }}
                                    />
                                    <span
                                        className="text-xs"
                                        style={{ color: colors.textSecondary }}
                                    >
                                        Updated {new Date(project.updated_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Project Modal */}
            <CreateProjectModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateProject}
                colors={colors}
            />
        </div>
    );
}

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Trash2,
    Save,
    RefreshCw,
    AlertCircle
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { getProject, updateProject, deleteProject } from "../services/api";
import ThemeSelector from "../components/ThemeSelector";

export default function ProjectSettings() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { getColors } = useTheme();
    const colors = getColors();

    const [project, setProject] = useState(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadProject();
    }, [projectId]);

    const loadProject = async () => {
        try {
            setLoading(true);
            const response = await getProject(projectId);
            setProject(response.data);
            setName(response.data.name);
            setDescription(response.data.description || "");
        } catch (err) {
            console.error("Failed to load project:", err);
            // navigate("/projects"); // Optional: redirect on error
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateProject(projectId, { name, description });
            alert("Project updated successfully");
        } catch (err) {
            console.error("Update failed:", err);
            alert("Failed to update project");
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;

        try {
            await deleteProject(projectId, true); // true for hard delete if intended
            navigate("/projects");
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Failed to delete project");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                <RefreshCw className="w-10 h-10 animate-spin" style={{ color: colors.accent1 }} />
            </div>
        );
    }

    if (!project) {
        return <div className="text-center p-10">Project not found</div>;
    }

    return (
        <div className="min-h-screen transition-colors duration-500" style={{ backgroundColor: colors.primary }}>
            {/* Background pattern */}
            <div className="fixed inset-0 opacity-5 pointer-events-none">
                <img src="/logo.jpg" alt="" className="w-full h-full object-cover" />
            </div>

            <div className="absolute top-6 right-6 z-50">
                <ThemeSelector />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(`/projects/${projectId}`)}
                        className="p-2 rounded-xl transition-all hover:scale-105"
                        style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}
                    >
                        <ArrowLeft className="w-5 h-5" style={{ color: colors.textSecondary }} />
                    </button>
                    <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
                        Project Settings
                    </h1>
                </div>

                {/* Settings Form */}
                <div className="p-8 rounded-3xl shadow-lg" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                    <form onSubmit={handleSave} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Project Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3 rounded-xl"
                                style={{ backgroundColor: colors.secondary, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="w-full p-3 rounded-xl resize-none"
                                style={{ backgroundColor: colors.secondary, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                            />
                        </div>

                        <div className="pt-4 flex items-center gap-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 py-3 rounded-xl font-medium text-white transition-all flex items-center justify-center gap-2"
                                style={{ background: `linear-gradient(135deg, ${colors.accent1}, ${colors.accent2})` }}
                            >
                                <Save className="w-4 h-4" />
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Danger Zone */}
                <div className="mt-8 p-8 rounded-3xl border border-red-200 bg-red-50">
                    <h3 className="text-lg font-bold text-red-700 mb-2">Danger Zone</h3>
                    <p className="text-sm text-red-600 mb-6">
                        Deleting this project will permanently remove all associated runs and data. This action cannot be undone.
                    </p>
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Project
                    </button>
                </div>

            </div>
        </div>
    );
}

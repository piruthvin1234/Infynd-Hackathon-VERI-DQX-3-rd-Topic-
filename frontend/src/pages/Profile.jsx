import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Save, User, Mail, Trash2, ImagePlus } from "lucide-react";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import ThemeSelector from "../components/ThemeSelector";

export default function Profile() {
    const { user, updateUser } = useUser();
    const { getColors } = useTheme();
    const colors = getColors();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [profilePicture, setProfilePicture] = useState(user?.profilePicture || "");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicture(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePicture = () => {
        setProfilePicture("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage("");

        await new Promise((resolve) => setTimeout(resolve, 1000));

        updateUser({
            name,
            email,
            profilePicture,
        });

        setMessage("Profile updated successfully!");
        setSaving(false);

        setTimeout(() => setMessage(""), 3000);
    };

    const getInitial = () => {
        if (name) return name.charAt(0).toUpperCase();
        if (email) return email.charAt(0).toUpperCase();
        return "U";
    };

    return (
        <div
            className="min-h-screen transition-colors duration-500"
            style={{ backgroundColor: colors.primary }}
        >
            {/* Background pattern */}
            <div className="fixed inset-0 opacity-5 pointer-events-none">
                <img src="/logo.jpg" alt="" className="w-full h-full object-cover" />
            </div>

            {/* Theme Toggle - Top Right */}
            <div className="absolute top-6 right-6 z-50">
                <ThemeSelector />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
                {/* Back button */}
                <button
                    onClick={() => navigate("/dashboard")}
                    className="flex items-center gap-2 mb-8 px-4 py-2 rounded-xl transition-all hover:scale-105"
                    style={{
                        color: colors.textSecondary,
                        backgroundColor: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                    }}
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Dashboard
                </button>

                {/* Profile Card */}
                <div
                    className="rounded-3xl p-8 shadow-2xl transition-colors duration-500"
                    style={{
                        backgroundColor: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                    }}
                >
                    <h1 className="text-3xl font-bold mb-8" style={{ color: colors.textPrimary }}>
                        Edit Profile
                    </h1>

                    {/* Profile Picture */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative">
                            <div
                                className="w-32 h-32 rounded-full overflow-hidden flex items-center justify-center text-white text-4xl font-bold shadow-xl"
                                style={{
                                    background: `linear-gradient(135deg, ${colors.accent1}, ${colors.accent2})`,
                                }}
                            >
                                {profilePicture ? (
                                    <img
                                        src={profilePicture}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span>{getInitial()}</span>
                                )}
                            </div>

                            {/* Action Buttons Container */}
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
                                {/* Add/Change Picture Button */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2.5 rounded-full text-white shadow-lg hover:shadow-xl transition-all hover:scale-110"
                                    style={{
                                        background: `linear-gradient(135deg, ${colors.accent1}, ${colors.accent2})`,
                                    }}
                                    title={profilePicture ? "Change picture" : "Add picture"}
                                >
                                    {profilePicture ? (
                                        <Camera className="w-4 h-4" />
                                    ) : (
                                        <ImagePlus className="w-4 h-4" />
                                    )}
                                </button>

                                {/* Remove Picture Button - Only show if there's a picture */}
                                {profilePicture && (
                                    <button
                                        onClick={handleRemovePicture}
                                        className="p-2.5 rounded-full text-white shadow-lg hover:shadow-xl transition-all hover:scale-110"
                                        style={{
                                            background: "linear-gradient(135deg, #ef4444, #dc2626)",
                                        }}
                                        title="Remove picture"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>

                        <p className="mt-6 text-sm" style={{ color: colors.textSecondary }}>
                            {profilePicture
                                ? "Click the camera to change or trash to remove"
                                : "Click the plus icon to add a profile photo"}
                        </p>
                    </div>

                    {/* Form */}
                    <div className="space-y-6">
                        {/* Name */}
                        <div>
                            <label
                                className="block text-sm font-medium mb-2"
                                style={{ color: colors.textSecondary }}
                            >
                                Full Name
                            </label>
                            <div className="relative">
                                <User
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5"
                                    style={{ color: colors.textSecondary }}
                                />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-xl transition-all focus:outline-none focus:ring-2"
                                    style={{
                                        backgroundColor: colors.secondary,
                                        border: `1px solid ${colors.border}`,
                                        color: colors.textPrimary,
                                    }}
                                    placeholder="Enter your name"
                                />
                            </div>
                        </div>

                        {/* Email (readonly) */}
                        <div>
                            <label
                                className="block text-sm font-medium mb-2"
                                style={{ color: colors.textSecondary }}
                            >
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5"
                                    style={{ color: colors.textSecondary }}
                                />
                                <input
                                    type="email"
                                    value={email}
                                    readOnly
                                    className="w-full pl-12 pr-4 py-4 rounded-xl cursor-not-allowed opacity-60"
                                    style={{
                                        backgroundColor: colors.secondary,
                                        border: `1px solid ${colors.border}`,
                                        color: colors.textSecondary,
                                    }}
                                />
                            </div>
                            <p className="mt-1 text-xs" style={{ color: colors.textSecondary }}>
                                Email cannot be changed
                            </p>
                        </div>

                        {/* Success Message */}
                        {message && (
                            <div
                                className="p-4 rounded-xl text-sm"
                                style={{
                                    backgroundColor: `${colors.accent1}20`,
                                    border: `1px solid ${colors.accent1}50`,
                                    color: colors.accent1,
                                }}
                            >
                                {message}
                            </div>
                        )}

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full py-4 px-6 rounded-xl text-white font-semibold shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                            style={{
                                background: `linear-gradient(135deg, ${colors.accent1}, ${colors.accent2})`,
                            }}
                        >
                            {saving ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

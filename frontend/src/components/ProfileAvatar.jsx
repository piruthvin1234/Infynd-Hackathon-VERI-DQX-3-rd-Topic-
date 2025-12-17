import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

export default function ProfileAvatar({ size = "medium", onClick }) {
    const { user } = useUser();
    const { getColors } = useTheme();
    const colors = getColors();

    const sizes = {
        small: "w-8 h-8 text-sm",
        medium: "w-10 h-10 text-base",
        large: "w-16 h-16 text-2xl",
    };

    const getInitial = () => {
        if (user?.name) {
            return user.name.charAt(0).toUpperCase();
        }
        if (user?.email) {
            return user.email.charAt(0).toUpperCase();
        }
        return "U";
    };

    return (
        <button
            onClick={onClick}
            className={`${sizes[size]} rounded-full overflow-hidden flex items-center justify-center text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2`}
            style={{
                background: `linear-gradient(135deg, ${colors.accent1}, ${colors.accent2})`,
                focusRingColor: colors.accent1,
            }}
        >
            {user?.profilePicture ? (
                <img
                    src={user.profilePicture}
                    alt={user.name || "Profile"}
                    className="w-full h-full object-cover"
                />
            ) : (
                <span>{getInitial()}</span>
            )}
        </button>
    );
}

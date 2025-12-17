import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import { useTheme } from "./context/ThemeContext";

export default function Layout() {
    const { getColors } = useTheme();
    const colors = getColors();

    return (
        <div
            className="min-h-screen transition-colors duration-500 flex flex-col"
            style={{ backgroundColor: colors.primary }}
        >
            <Header />
            <main className="flex-grow">
                <Outlet />
            </main>
        </div>
    );
}

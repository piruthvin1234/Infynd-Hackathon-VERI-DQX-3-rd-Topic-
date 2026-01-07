import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import Chatbot from "./components/Chatbot";
import { useTheme } from "./context/ThemeContext";
import { useChat } from "./context/ChatContext";

export default function Layout() {
    const { getColors } = useTheme();
    const colors = getColors();
    const { chatContext, pageContext } = useChat();

    return (
        <div
            className="min-h-screen transition-colors duration-500 flex flex-col"
            style={{ backgroundColor: colors.primary }}
        >
            <Header />
            <main className="flex-grow">
                <Outlet />
            </main>

            {/* Global AI Chatbot */}
            <Chatbot dataContext={chatContext} pageContext={pageContext} />
        </div>
    );
}

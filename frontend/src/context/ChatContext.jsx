import { createContext, useContext, useState } from "react";

const ChatContext = createContext();

export function ChatProvider({ children }) {
    const [chatContext, setChatContext] = useState(null);
    const [pageContext, setPageContext] = useState("");

    const clearChatContext = () => {
        setChatContext(null);
    };

    return (
        <ChatContext.Provider value={{
            chatContext,
            setChatContext,
            pageContext,
            setPageContext,
            clearChatContext
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used within ChatProvider");
    }
    return context;
}

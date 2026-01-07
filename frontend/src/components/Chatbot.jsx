import { useState, useEffect, useRef } from 'react';
import { X, Send, Minus, Square, Trash2, Bot, User, Sparkles, MessageSquare } from 'lucide-react';

const Chatbot = ({ dataContext = null, pageContext = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hello! I'm your Data Quality AI Assistant. I can help you understand your data analysis, answer questions about validation results, and provide actionable insights. How can I assist you today?"
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const sessionId = useRef(`session_${Date.now()}`);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && !isMinimized) {
            scrollToBottom();
        }
    }, [messages, isOpen, isMinimized]);

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = inputMessage.trim();
        setInputMessage('');

        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    message: userMessage,
                    session_id: sessionId.current,
                    context: dataContext,
                    page_context: pageContext
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I apologize, but I'm having trouble responding right now. Please try again."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = async () => {
        try {
            await fetch(`http://localhost:8000/api/chat/session/${sessionId.current}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            sessionId.current = `session_${Date.now()}`;
            setMessages([
                {
                    role: 'assistant',
                    content: 'Chat cleared. How can I assist you with your data today?'
                }
            ]);
        } catch (error) {
            console.error('Clear chat error:', error);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            <style>
                {`
                .chat-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .chat-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .chat-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(59, 130, 246, 0.4);
                    border-radius: 10px;
                }
                .chat-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(59, 130, 246, 0.6);
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .message-fade-in {
                    animation: fadeIn 0.3s ease-out;
                }

                .loading-dots {
                    display: flex;
                    gap: 4px;
                    align-items: center;
                }

                .loading-dots span {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #3b82f6;
                    animation: bounce 1.4s infinite ease-in-out both;
                }

                .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
                .loading-dots span:nth-child(2) { animation-delay: -0.16s; }

                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
                    40% { transform: scale(1); opacity: 1; }
                }

                @keyframes pulse-ring {
                    0% {
                        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
                    }
                    70% {
                        box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
                    }
                    100% {
                        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
                    }
                }

                .pulse-ring {
                    animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                `}
            </style>

            {/* Floating Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl pulse-ring"
                    style={{
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, #1e293b, #000000)',
                        border: '1px solid #334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <div className="relative">
                        <MessageSquare className="w-7 h-7 text-white" strokeWidth={2} />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-black"></div>
                    </div>
                </button>
            )}

            {/* Professional Black Theme Chat Window */}
            {isOpen && (
                <div
                    className="fixed bottom-6 right-6 z-50 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden"
                    style={{
                        width: isMinimized ? '380px' : '420px',
                        height: isMinimized ? '70px' : '600px',
                        backgroundColor: '#0a0a0a',
                        border: '1px solid #1f2937',
                    }}
                >
                    {/* Header */}
                    <div
                        className="px-5 py-4 flex items-center justify-between border-b"
                        style={{
                            background: 'linear-gradient(135deg, #111827, #000000)',
                            borderColor: '#1f2937'
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
                                <Bot className="w-5 h-5 text-blue-400" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-white m-0 leading-tight">
                                    AI Assistant
                                </h3>
                                <p className="text-xs text-gray-400 m-0 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                                    System Active
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={clearChat}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                                title="Clear conversation"
                            >
                                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                            </button>
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                {isMinimized ? (
                                    <Square className="w-4 h-4 text-gray-400" />
                                ) : (
                                    <Minus className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-400 hover:text-white" />
                            </button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            {/* Message Area */}
                            <div
                                className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar"
                                style={{
                                    backgroundColor: '#020617',
                                    backgroundImage: 'radial-gradient(circle at top right, #1e1b4b, transparent)',
                                }}
                            >
                                {messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} message-fade-in`}
                                    >
                                        <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            {/* Avatar */}
                                            <div
                                                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg border"
                                                style={{
                                                    background: msg.role === 'assistant'
                                                        ? 'linear-gradient(135deg, #1e293b, #0f172a)'
                                                        : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                                    borderColor: msg.role === 'assistant' ? '#334155' : '#2563eb'
                                                }}
                                            >
                                                {msg.role === 'assistant' ? (
                                                    <Bot className="w-4 h-4 text-blue-400" strokeWidth={2.5} />
                                                ) : (
                                                    <User className="w-4 h-4 text-white" strokeWidth={2.5} />
                                                )}
                                            </div>

                                            {/* Message Bubble */}
                                            <div
                                                className="rounded-2xl px-4 py-3 shadow-md border"
                                                style={msg.role === 'assistant' ? {
                                                    backgroundColor: '#0f172a',
                                                    borderColor: '#1e293b',
                                                } : {
                                                    background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                                                    borderColor: '#2563eb',
                                                    color: '#ffffff',
                                                }}
                                            >
                                                <p className="text-sm leading-relaxed m-0 whitespace-pre-wrap"
                                                    style={{
                                                        color: msg.role === 'assistant' ? '#e2e8f0' : '#ffffff'
                                                    }}
                                                >
                                                    {msg.content}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex justify-start message-fade-in">
                                        <div className="flex gap-3 max-w-[85%]">
                                            <div
                                                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg border"
                                                style={{
                                                    background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                                                    borderColor: '#334155'
                                                }}
                                            >
                                                <Bot className="w-4 h-4 text-blue-400" strokeWidth={2.5} />
                                            </div>
                                            <div
                                                className="rounded-2xl px-4 py-3 shadow-md border"
                                                style={{
                                                    backgroundColor: '#0f172a',
                                                    borderColor: '#1e293b',
                                                }}
                                            >
                                                <div className="loading-dots">
                                                    <span></span>
                                                    <span></span>
                                                    <span></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div
                                className="p-4 border-t"
                                style={{
                                    backgroundColor: '#0a0a0a',
                                    borderColor: '#1f2937',
                                }}
                            >
                                <div className="flex items-end gap-2">
                                    <div className="flex-1 relative">
                                        <textarea
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Type your message..."
                                            rows={1}
                                            className="w-full px-4 py-3 rounded-xl outline-none transition-all text-sm resize-none border"
                                            style={{
                                                backgroundColor: '#020617',
                                                borderColor: '#1e293b',
                                                color: '#f8fafc',
                                                maxHeight: '120px',
                                            }}
                                            disabled={isLoading}
                                            onInput={(e) => {
                                                e.target.style.height = 'auto';
                                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                            }}
                                        />
                                    </div>
                                    <button
                                        onClick={sendMessage}
                                        disabled={!inputMessage.trim() || isLoading}
                                        className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border border-transparent"
                                        style={{
                                            background: inputMessage.trim() && !isLoading
                                                ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                                                : '#1e293b',
                                            borderColor: inputMessage.trim() && !isLoading ? '#2563eb' : 'transparent'
                                        }}
                                    >
                                        <Send className={`w-5 h-5 ${inputMessage.trim() && !isLoading ? 'text-white' : 'text-gray-500'}`} strokeWidth={2.5} />
                                    </button>
                                </div>
                                <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-gray-500 uppercase tracking-widest font-medium">
                                    <Sparkles className="w-3 h-3 text-blue-400" />
                                    <span>AI Neural Interface</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default Chatbot;

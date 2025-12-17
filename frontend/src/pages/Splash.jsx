import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import loaderVideo from "../templates/LOADER.mp4";

export default function Splash() {
    const [fadeOut, setFadeOut] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const timer1 = setTimeout(() => {
            setFadeOut(true);
        }, 9000); // Start fade out after 9 seconds

        const timer2 = setTimeout(() => {
            const token = localStorage.getItem("token");
            if (token) {
                navigate("/dashboard");
            } else {
                navigate("/login");
            }
        }, 10000); // Navigate after 10 seconds

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [navigate]);

    return (
        <div
            className="fixed inset-0 flex items-center justify-center"
            style={{ backgroundColor: "#000000" }}
        >
            {/* Main Content Container - Centered */}
            <div className="relative z-10 flex items-center justify-center gap-0">

                {/* Left Side - Logo */}
                <div className="flex items-center justify-center">
                    <img
                        src="/logo.jpg"
                        alt="VETRI DQX"
                        className={`w-full max-w-xl object-contain transform transition-all duration-1000 ${fadeOut ? "scale-110 opacity-0" : "scale-100 opacity-100"
                            }`}
                    />
                </div>

                {/* Right Side - Video */}
                <div className="flex items-center justify-center">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className={`w-full max-w-lg rounded-lg shadow-2xl transform transition-all duration-1000 ${fadeOut ? "scale-110 opacity-0" : "scale-100 opacity-100"
                            }`}
                    >
                        <source src={loaderVideo} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>
        </div>
    );
}

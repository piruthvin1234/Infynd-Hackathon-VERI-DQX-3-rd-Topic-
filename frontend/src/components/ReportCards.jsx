import { AlertCircle, CheckCircle, Wrench, TrendingUp } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ReportCards({ report }) {
    const { getColors } = useTheme();
    const colors = getColors();

    if (!report) return null;

    const { qa_report } = report;

    const cards = [
        {
            title: "Quality Score",
            value: qa_report.quality_score,
            suffix: "/100",
            icon: TrendingUp,
            color: "#10b981",
        },
        {
            title: "Issues Found",
            value: qa_report.issues_found,
            suffix: "",
            icon: AlertCircle,
            color: "#f59e0b",
        },
        {
            title: "Fixes Applied",
            value: qa_report.fixes_applied,
            suffix: "",
            icon: Wrench,
            color: "#3b82f6",
        },
        {
            title: "Data Confidence",
            value: Math.round(qa_report.quality_score),
            suffix: "%",
            icon: CheckCircle,
            color: "#8b5cf6",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className="relative overflow-hidden rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group"
                    style={{
                        backgroundColor: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                    }}
                >
                    {/* Background decoration */}
                    <div
                        className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-500"
                        style={{ backgroundColor: card.color }}
                    />

                    <div className="relative z-10">
                        <div
                            className="inline-flex p-3 rounded-2xl shadow-lg mb-4"
                            style={{ backgroundColor: card.color }}
                        >
                            <card.icon className="w-6 h-6 text-white" />
                        </div>

                        <p className="font-medium mb-1" style={{ color: colors.textSecondary }}>
                            {card.title}
                        </p>
                        <p className="text-4xl font-bold" style={{ color: colors.textPrimary }}>
                            {typeof card.value === "number" ? card.value.toFixed(1) : card.value}
                            <span className="text-lg" style={{ color: colors.textSecondary }}>
                                {card.suffix}
                            </span>
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

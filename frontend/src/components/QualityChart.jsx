import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from "recharts";
import { useTheme } from "../context/ThemeContext";

export default function QualityChart({ score }) {
    const { getColors } = useTheme();
    const colors = getColors();

    if (score === undefined) return null;

    const data = [
        { name: "Clean Data", value: score },
        { name: "Issues", value: 100 - score },
    ];

    const COLORS = ["#10b981", "#ef4444"];

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div
                    className="px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm"
                    style={{
                        backgroundColor: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                    }}
                >
                    <p className="font-semibold" style={{ color: colors.textPrimary }}>
                        {payload[0].name}
                    </p>
                    <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                        {payload[0].value.toFixed(1)}%
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div
            className="rounded-3xl shadow-2xl p-8 mt-8 transition-colors duration-500"
            style={{
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.border}`,
            }}
        >
            <h3 className="text-2xl font-bold mb-6" style={{ color: colors.textPrimary }}>
                Data Quality Overview
            </h3>

            <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="w-full lg:w-1/2 h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index]}
                                        className="transition-all duration-300 hover:opacity-80"
                                        style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" }}
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                formatter={(value) => (
                                    <span className="font-medium" style={{ color: colors.textSecondary }}>
                                        {value}
                                    </span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="w-full lg:w-1/2 space-y-4">
                    <div
                        className="p-6 rounded-2xl"
                        style={{
                            backgroundColor: "rgba(16, 185, 129, 0.1)",
                            border: "1px solid rgba(16, 185, 129, 0.3)",
                        }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-medium" style={{ color: colors.textSecondary }}>
                                Clean Data
                            </span>
                            <span className="text-3xl font-bold text-emerald-500">
                                {score.toFixed(1)}%
                            </span>
                        </div>
                        <div
                            className="w-full rounded-full h-3"
                            style={{ backgroundColor: "rgba(16, 185, 129, 0.2)" }}
                        >
                            <div
                                className="bg-gradient-to-r from-emerald-400 to-teal-500 h-3 rounded-full transition-all duration-1000"
                                style={{ width: `${score}%` }}
                            />
                        </div>
                    </div>

                    <div
                        className="p-6 rounded-2xl"
                        style={{
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                        }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-medium" style={{ color: colors.textSecondary }}>
                                Issues
                            </span>
                            <span className="text-3xl font-bold text-red-500">
                                {(100 - score).toFixed(1)}%
                            </span>
                        </div>
                        <div
                            className="w-full rounded-full h-3"
                            style={{ backgroundColor: "rgba(239, 68, 68, 0.2)" }}
                        >
                            <div
                                className="bg-gradient-to-r from-red-400 to-orange-500 h-3 rounded-full transition-all duration-1000"
                                style={{ width: `${100 - score}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

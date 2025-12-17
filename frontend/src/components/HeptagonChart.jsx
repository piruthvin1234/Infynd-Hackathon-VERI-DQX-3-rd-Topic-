
import React, { useEffect, useRef, useState } from 'react';
import './HeptagonChart.css';

const HeptagonChart = ({ data, colors }) => {
    const canvasRef = useRef(null);
    const [hoverIndex, setHoverIndex] = useState(-1);

    // Default dataset if none provided (or for testing)
    const defaultData = [
        { label: "Potential Duplicates", value: "0%" },
        { label: "Invalid / Missing Fields", value: "0%" },
        { label: "Suggested Corrections", value: "0%" },
        { label: "Map Job Titles", value: "0%" },
        { label: "Confidence Level", value: "0%" },
        { label: "Data Quality", value: "0%" },
        { label: "Count of Issues", value: "0%" }
    ];

    const dataset = (data && data.length === 7) ? data : defaultData;

    // Helper to parse "45%" to 45
    const getValue = (valStr) => {
        if (typeof valStr === 'number') return valStr;
        if (!valStr) return 0;
        return parseInt(valStr.replace('%', '')) || 0;
    };

    // Fallback colors if not provided
    const themeColors = colors || {
        primary: "#020612",
        textPrimary: "#ffffff",
        textSecondary: "#a0c4ff",
        accent1: "#00d4ff",
        accent2: "#8b5cf6",
        border: "rgba(0, 212, 255, 0.2)"
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // Chart Config
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const baseRadius = 220; // Max radius (100%)
        const sides = 7;
        const angleStep = (Math.PI * 2) / sides;
        const rotationOffset = -Math.PI / 2; // Start at 12 o'clock

        // Usage function
        const getCoords = (angle, r) => {
            return {
                x: centerX + r * Math.cos(angle),
                y: centerY + r * Math.sin(angle)
            };
        };

        const drawPolygon = (ratio, strokeStyle, fillStyle) => {
            ctx.beginPath();
            for (let i = 0; i < sides; i++) {
                const angle = (i * angleStep) + rotationOffset;
                const r = baseRadius * ratio;
                const { x, y } = getCoords(angle, r);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            if (fillStyle) {
                ctx.fillStyle = fillStyle;
                ctx.fill();
            }
            if (strokeStyle) {
                ctx.lineWidth = 1;
                ctx.strokeStyle = strokeStyle;
                ctx.stroke();
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 1. Draw Background Grid (Concentric Heptagons)
            // 20%, 40%, 60%, 80%, 100%
            [0.2, 0.4, 0.6, 0.8, 1.0].forEach((ratio) => {
                drawPolygon(ratio, `${themeColors.accent1}33`, null); // 20% opacity lines
            });

            // 2. Draw Spokes (Lines from center to vertices)
            ctx.beginPath();
            for (let i = 0; i < sides; i++) {
                const angle = (i * angleStep) + rotationOffset;
                const { x, y } = getCoords(angle, baseRadius);
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `${themeColors.accent1}33`;
            ctx.stroke();

            // 3. Draw Data Shape
            ctx.beginPath();
            const dataPoints = [];

            for (let i = 0; i < sides; i++) {
                const val = getValue(dataset[i].value);
                // Clamp value between 0 and 100
                const percent = Math.min(Math.max(val, 0), 100) / 100;
                // Minimum visible radius for 0% so it's not collapsed completely? 
                // Let's keep strict 0 at center for radar charts usually.
                const r = baseRadius * percent;

                const angle = (i * angleStep) + rotationOffset;
                const { x, y } = getCoords(angle, r);
                dataPoints.push({ x, y, r, angle, val, label: dataset[i].label, valueStr: dataset[i].value });

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();

            // Fill Data Shape
            ctx.fillStyle = `${themeColors.accent1}66`; // 40% opacity
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = themeColors.accent1;
            ctx.shadowColor = themeColors.accent1;
            ctx.shadowBlur = 15;
            ctx.stroke();

            // Reset Shadow
            ctx.shadowBlur = 0;

            // 4. Draw Points & Labels
            dataPoints.forEach((p, i) => {
                const isHovered = (i === hoverIndex);

                // Draw Point on Data Shape
                ctx.beginPath();
                ctx.arc(p.x, p.y, isHovered ? 8 : 5, 0, Math.PI * 2);
                ctx.fillStyle = isHovered ? themeColors.textPrimary : themeColors.accent1;
                ctx.fill();
                ctx.strokeStyle = themeColors.primary; // Contrast ring
                ctx.lineWidth = 2;
                ctx.stroke();

                // Draw Label (Outside at fixed radius)
                const labelRadius = baseRadius + 30; // Push out fixed distance
                const labelPos = getCoords(p.angle, labelRadius);

                ctx.save();
                ctx.translate(labelPos.x, labelPos.y);

                ctx.fillStyle = isHovered ? themeColors.textPrimary : themeColors.textSecondary;
                ctx.font = isHovered ? "bold 14px 'Orbitron', sans-serif" : "12px 'Orbitron', sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                // Word Wrap for Label
                const words = p.label.split(' ');
                let yOffset = 0;

                if (words.length > 2) {
                    const mid = Math.ceil(words.length / 2);
                    const line1 = words.slice(0, mid).join(' ');
                    const line2 = words.slice(mid).join(' ');
                    ctx.fillText(line1, 0, -8);
                    ctx.fillText(line2, 0, 8);
                } else {
                    ctx.fillText(p.label, 0, 0);
                }

                // If hovered, show Value prominently near the point or under label
                // Let's put value under the label permanently for visibility requested by user
                ctx.font = "bold 14px 'Orbitron', sans-serif";
                ctx.fillStyle = themeColors.accent1;
                ctx.shadowColor = themeColors.primary === "#020612" ? "black" : "white";
                ctx.shadowBlur = 2;
                // Move down below label
                ctx.fillText(p.valueStr, 0, 25);

                ctx.restore();
            });

            // 5. Center Hub
            ctx.beginPath();
            ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
            ctx.fillStyle = themeColors.textPrimary;
            ctx.fill();
        };

        draw();

        // Mouse interaction logic (Hit testing against sectors)
        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const dx = mouseX - centerX;
            const dy = mouseY - centerY;
            // Use angle to determine sector
            let angle = Math.atan2(dy, dx);
            angle = angle - rotationOffset;
            // Normalize angle
            if (angle < 0) angle += Math.PI * 2;
            angle = angle % (Math.PI * 2);

            // Sector logic
            // Each sector is centered around the spoke? Or between spokes?
            // Let's do nearest spoke logic
            // Align angle so spoke is center of sector
            // Spoke angles: 0, Step, 2*Step...

            // Adjust angle to be relative to spoke 0
            const halfStep = angleStep / 2;
            let checkAngle = angle + halfStep;
            // Wrap
            if (checkAngle >= Math.PI * 2) checkAngle -= Math.PI * 2;

            const index = Math.floor(checkAngle / angleStep);

            // Distance check to ensure we are somewhat near graph
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < baseRadius + 60 && distance > 5) {
                if (hoverIndex !== index) {
                    setHoverIndex(index);
                }
            } else {
                if (hoverIndex !== -1) {
                    setHoverIndex(-1);
                }
            }
        };

        const handleMouseLeave = () => {
            setHoverIndex(-1);
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };

    }, [dataset, hoverIndex, themeColors]);

    return (
        <div className="heptagon-wrapper relative flex justify-center items-center">
            {/* Optional background glow aligned with theme */}
            <div
                className="absolute w-full h-full opacity-20 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at center, ${themeColors.accent1} 0%, transparent 70%)`
                }}
            />
            <div className="heptagon-chart-container relative z-10">
                <canvas
                    ref={canvasRef}
                    className="heptagon-canvas"
                    width={700}
                    height={600}
                />
            </div>
            {/* Legend/Data panel hidden as requested previously */}
        </div>
    );
};

export default HeptagonChart;

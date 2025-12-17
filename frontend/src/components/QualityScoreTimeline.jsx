import React, { useEffect, useRef, useState } from 'react';
import './QualityScoreTimeline.css';

const QualityScoreTimeline = ({ dataPoints = [], colors }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const tooltipRef = useRef(null);
    const [tooltipData, setTooltipData] = useState({ visible: false, x: 0, y: 0, score: 0, label: '' });

    // Provide default data if none exists
    const displayData = dataPoints.length > 0
        ? dataPoints.map(d => ({
            label: `Run #${d.run_number}`,
            score: d.quality_score
        }))
        : [
            { label: "Start", score: 0 },
            { label: "Now", score: 0 }
        ];

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let time = 0;

        // Particle system
        const particles = [];
        const PARTICLE_COUNT = 40;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                t: Math.random(),
                speed: 0.002 + Math.random() * 0.003,
                size: Math.random() * 2 + 1
            });
        }

        let hoveredIndex = null;
        let width, height;

        const resize = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
            canvas.width = width * window.devicePixelRatio;
            canvas.height = height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };

        // Resize observer to handle container resize
        const resizeObserver = new ResizeObserver(resize);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        // --- Helpers ---
        const getPointCoordinates = (index) => {
            const paddingX = 80;
            const paddingY = 80;
            const availWidth = width - (paddingX * 2);
            const availHeight = height - (paddingY * 2);

            const x = paddingX + (index / (Math.max(displayData.length - 1, 1))) * availWidth;
            // Invert Y because canvas 0 is at top
            // Score 0-100 mapped to available height
            const y = (height - paddingY) - (displayData[index].score / 100) * availHeight;
            return { x, y };
        };

        const drawSpline = (ctx, points, tension = 0.5) => {
            if (points.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);

            for (let i = 0; i < points.length - 1; i++) {
                const p0 = i > 0 ? points[i - 1] : points[0];
                const p1 = points[i];
                const p2 = points[i + 1];
                const p3 = i !== points.length - 2 ? points[i + 2] : p2;

                const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
                const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;

                const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
                const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
            }
            ctx.stroke();
        };

        // --- Interaction ---
        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left); // Device independent pixels
            const mouseY = (e.clientY - rect.top);

            let found = null;
            if (width && height) {
                const points = displayData.map((_, i) => getPointCoordinates(i));
                points.forEach((p, i) => {
                    const dx = mouseX - p.x;
                    const dy = mouseY - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 30) { // Hover radius
                        found = i;
                    }
                });
            }

            hoveredIndex = found;

            if (found !== null) {
                const p = getPointCoordinates(found);
                setTooltipData({
                    visible: true,
                    x: p.x,
                    y: p.y,
                    score: displayData[found].score,
                    label: displayData[found].label
                });
            } else {
                setTooltipData(prev => ({ ...prev, visible: false }));
            }
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', () => {
            hoveredIndex = null;
            setTooltipData(prev => ({ ...prev, visible: false }));
        });


        // --- Main Draw Loop ---
        const animate = () => {
            if (!ctx || !width || !height) {
                animationFrameId = requestAnimationFrame(animate);
                return;
            }

            ctx.clearRect(0, 0, width, height);
            time += 0.05;

            // Use theme colors
            const primaryColor = colors.accent1 || '#00d4ff'; // Cyan/Blue
            const gridColor = colors.border || 'rgba(0, 212, 255, 0.1)';
            const particleColor = colors.textPrimary || '#ffffff';

            // 1. Draw "Perspective Floor" Grid
            ctx.save();
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();

            const horizonY = height - 50;
            // Vertical perspective lines
            for (let i = -5; i <= 15; i++) {
                const x = width / 2 + (i * 100);
                ctx.moveTo(x, horizonY);
                ctx.lineTo(width / 2 + (i * 150), height);
            }
            // Horizontal lines
            for (let i = 0; i < 5; i++) {
                const y = horizonY + (i * 30);
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
            }
            ctx.stroke();
            ctx.restore();

            // 2. Calculate All Point Coordinates
            const points = displayData.map((_, i) => getPointCoordinates(i));

            // 3. Draw The Glow Line (The Path)
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = primaryColor;
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = 3;
            drawSpline(ctx, points);
            ctx.restore();

            // Reflection
            ctx.save();
            ctx.strokeStyle = primaryColor;
            ctx.globalAlpha = 0.1;
            ctx.lineWidth = 2;
            ctx.transform(1, 0, 0, -0.5, 0, height + 150); // Flip and squash
            drawSpline(ctx, points);
            ctx.restore();

            // 4. Draw Flowing Particles
            ctx.save();
            ctx.fillStyle = particleColor;
            ctx.shadowBlur = 5;
            ctx.shadowColor = particleColor;

            particles.forEach(p => {
                p.t += p.speed;
                if (p.t > 1) p.t = 0;

                const totalSegments = points.length - 1;
                const segmentT = p.t * totalSegments;
                const index = Math.floor(segmentT);
                const localT = segmentT - index;

                if (index < points.length - 1) {
                    const p1 = points[index];
                    const p2 = points[index + 1];
                    const px = p1.x + (p2.x - p1.x) * localT;
                    const py = p1.y + (p2.y - p1.y) * localT;
                    const wobble = Math.sin(time + p.t * 10) * 5;

                    ctx.beginPath();
                    ctx.arc(px, py + wobble, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            ctx.restore();

            // 5. Draw Data Nodes (Orbs)
            points.forEach((p, i) => {
                const isHovered = hoveredIndex === i;

                // Connector line to floor
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x, height - 50);
                ctx.strokeStyle = gridColor;
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.restore();

                // The Orb
                ctx.save();
                ctx.beginPath();
                ctx.arc(p.x, p.y, isHovered ? 8 : 4, 0, Math.PI * 2);
                ctx.fillStyle = colors.cardBg; // Center matches card bg
                ctx.fill();

                ctx.lineWidth = 2;
                ctx.strokeStyle = isHovered ? particleColor : primaryColor;
                ctx.shadowBlur = isHovered ? 20 : 10;
                ctx.shadowColor = primaryColor;
                ctx.stroke();
                ctx.restore();

                // Rotating Ring
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(time + i);
                ctx.beginPath();
                ctx.arc(0, 0, 12, -0.5, 0.5);
                ctx.arc(0, 0, 12, Math.PI - 0.5, Math.PI + 0.5);
                ctx.strokeStyle = primaryColor;
                ctx.globalAlpha = 0.5;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();

                // Hover Effect: "Scanner Beam"
                if (isHovered) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x, 0);
                    const grad = ctx.createLinearGradient(p.x, p.y, p.x, 0);
                    grad.addColorStop(0, primaryColor + '80'); // Hex + alpha
                    grad.addColorStop(1, primaryColor + '00');
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = 30;
                    ctx.stroke();
                    ctx.restore();
                }
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        // Init resize
        resize();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            resizeObserver.disconnect();
            cancelAnimationFrame(animationFrameId);
            canvas.removeEventListener('mousemove', handleMouseMove);
        };
    }, [colors, displayData]); // Re-run if colors or data change

    return (
        <div
            ref={containerRef}
            className="quality-timeline-container"
            style={{
                backgroundColor: colors.cardBg, // Or slightly darker?
                border: `1px solid ${colors.border}`,
                boxShadow: `0 0 30px ${colors.shadow || 'rgba(0,0,0,0.2)'}`
            }}
        >
            <div className="absolute top-4 left-6 z-10 pointer-events-none">
                <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: colors.accent1 }}>
                    Quality Stream
                </h3>
                <p className="text-xs opacity-70" style={{ color: colors.textSecondary }}>
                    Live AI Performance Tracking
                </p>
            </div>

            <canvas ref={canvasRef} className="quality-timeline-canvas" />

            {/* Tooltip */}
            <div
                ref={tooltipRef}
                className="qt-tooltip"
                style={{
                    opacity: tooltipData.visible ? 1 : 0,
                    top: tooltipData.y,
                    left: tooltipData.x,
                    backgroundColor: colors.cardBg, // Match theme
                    borderColor: colors.accent1,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    color: colors.textPrimary,
                    boxShadow: `0 0 15px ${colors.accent1}40`
                }}
            >
                <div className="qt-tooltip-score" style={{ color: colors.textPrimary, textShadow: `0 0 10px ${colors.accent1}` }}>
                    {tooltipData.score}%
                </div>
                <div className="qt-tooltip-label" style={{ color: colors.accent1 }}>
                    {tooltipData.label}
                </div>
            </div>
        </div>
    );
};

export default QualityScoreTimeline;

import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useHarmonic } from '../../context/HarmonicContext';
import { getIntervalColor } from '../../utils/intervalColors';

interface KeyboardMinimapProps {
    scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

// Constants for minimap rendering
const WHITE_KEY_COUNT = 15;
const BLACK_KEY_LINES = [1, 2, 4, 5, 6, 8, 9, 11, 12, 13];
const MINIMAP_HEIGHT = 40;
const BLACK_KEY_HEIGHT_PERCENT = 60;

// ASPECT RATIO CORRECTION FOR RADIUS
const RADIUS_X = 1.0;
const RADIUS_Y = 6.0;

// Fallback color for minimap when interval color is default
const MINIMAP_FALLBACK_COLOR = '#3b82f6';

// Wrapper to use shared color logic with minimap-specific fallback
const getMinimapColor = (interval?: string) => {
    const color = getIntervalColor(interval);
    return color === '#333' ? MINIMAP_FALLBACK_COLOR : color;
};

export const KeyboardMinimap: React.FC<KeyboardMinimapProps> = ({ scrollContainerRef }) => {
    const { activeNotes, analysis } = useHarmonic();
    const minimapRef = useRef<HTMLDivElement>(null);
    const [viewportPosition, setViewportPosition] = useState(0);
    const [viewportWidth, setViewportWidth] = useState(50);
    const isDragging = useRef(false);

    // Calculate and update viewport based on scroll position
    const updateViewport = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const scrollLeft = container.scrollLeft;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;

        if (scrollWidth <= clientWidth) {
            setViewportPosition(0);
            setViewportWidth(100);
            return;
        }

        const maxScroll = scrollWidth - clientWidth;
        const positionPercent = (scrollLeft / maxScroll) * 100;
        const widthPercent = (clientWidth / scrollWidth) * 100;

        setViewportPosition(positionPercent * (100 - widthPercent) / 100);
        setViewportWidth(widthPercent);
    }, [scrollContainerRef]);

    // Listen to scroll events on the piano container
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        updateViewport();
        container.addEventListener('scroll', updateViewport);
        window.addEventListener('resize', updateViewport);

        return () => {
            container.removeEventListener('scroll', updateViewport);
            window.removeEventListener('resize', updateViewport);
        };
    }, [scrollContainerRef, updateViewport]);

    // Handle click/drag on minimap to scroll the piano
    const handleMinimapInteraction = useCallback((clientX: number) => {
        const container = scrollContainerRef.current;
        const minimap = minimapRef.current;
        if (!container || !minimap) return;

        const rect = minimap.getBoundingClientRect();
        const clickPercent = (clientX - rect.left) / rect.width;

        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        const maxScroll = scrollWidth - clientWidth;

        // Calculate offset to center viewport on click, clamped
        const targetScroll = (clickPercent * scrollWidth) - (clientWidth / 2);
        container.scrollLeft = Math.max(0, Math.min(maxScroll, targetScroll));
    }, [scrollContainerRef]);

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        handleMinimapInteraction(e.clientX);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging.current) {
            handleMinimapInteraction(e.clientX);
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        isDragging.current = true;
        handleMinimapInteraction(e.touches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isDragging.current) {
            handleMinimapInteraction(e.touches[0].clientX);
        }
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
    };

    // Helper to generate key shape
    const generateKeyShape = useCallback((gridIdx: number, isBlack: boolean) => {
        const wKeyWidth = 100 / WHITE_KEY_COUNT;
        const rx = RADIUS_X;
        const ry = RADIUS_Y;

        if (isBlack) {
            // Black Key Shape
            const x = gridIdx * wKeyWidth;
            const bkWidth = wKeyWidth * 0.6;
            const xLeft = x - (bkWidth / 2);
            const xRight = x + (bkWidth / 2);

            const H = BLACK_KEY_HEIGHT_PERCENT;

            // Rounded Bottom
            return `M ${xLeft} 0 L ${xLeft} ${H - ry} A ${rx} ${ry} 0 0 0 ${xLeft + rx} ${H} L ${xRight - rx} ${H} A ${rx} ${ry} 0 0 0 ${xRight} ${H - ry} L ${xRight} 0 Z`;
        } else {
            // White Key Shape
            const wL = gridIdx * wKeyWidth;
            const wR = (gridIdx + 1) * wKeyWidth;

            const hasBlackLeft = BLACK_KEY_LINES.includes(gridIdx);
            const hasBlackRight = BLACK_KEY_LINES.includes(gridIdx + 1);

            const bkHalWidth = (wKeyWidth * 0.6) / 2;
            const H = BLACK_KEY_HEIGHT_PERCENT;

            // X coordinates at top/shoulders
            const xTopLeft = hasBlackLeft ? wL + bkHalWidth : wL;
            const xTopRight = hasBlackRight ? wR - bkHalWidth : wR;

            let d = '';

            // Start Top Left
            d += `M ${xTopLeft} 0 `;

            // Left Shoulder (matches Right Side of Left Black Key)
            if (hasBlackLeft) {
                // Go down to rounded corner start
                d += `L ${xTopLeft} ${H - ry} `;
                // Arc IN (Sweep 1) to (xTopLeft - rx, H)
                d += `A ${rx} ${ry} 0 0 1 ${xTopLeft - rx} ${H} `;
                // Line to wL
                d += `L ${wL} ${H} `;
            }

            // Down to Bottom Left (rounded)
            d += `L ${wL} ${100 - ry} `;
            d += `A ${rx} ${ry} 0 0 0 ${wL + rx} 100 `;

            // Line to Bottom Right
            d += `L ${wR - rx} 100 `;
            d += `A ${rx} ${ry} 0 0 0 ${wR} ${100 - ry} `;

            // Up to Right Shoulder
            if (hasBlackRight) {
                // Line up to H (from bottom right)
                d += `L ${wR} ${H} `;
                // Line Left to rounded corner start (xTopRight + rx)
                d += `L ${xTopRight + rx} ${H} `;
                // Arc UP/LEFT (Sweep 1) to (xTopRight, H - ry)
                // Wait. Start point is (xTopRight+rx, H). End is (xTopRight, H-ry).
                // Curve is "concave" relative to white key? 
                // Matches Black Key "Left Bottom" corner.
                // Black key Left Bottom: ... L xLeft (H-ry) A ... xLeft+rx H.
                // We are tracing REVERSE.
                // From (xTopRight+rx, H) to (xTopRight, H-ry).
                // Correct.
                d += `A ${rx} ${ry} 0 0 1 ${xTopRight} ${H - ry} `;
                // Line UP to 0
                d += `L ${xTopRight} 0 `;
            } else {
                d += `L ${wR} 0 `;
            }

            d += `Z`;
            return d;
        }
    }, []);

    // Generate SVG path data for wireframe (ALL keys)
    const { whiteKeysPath, blackKeysPath } = useMemo(() => {
        let wPath = '';
        let bPath = '';

        // Generate White Keys
        for (let i = 0; i < WHITE_KEY_COUNT; i++) {
            wPath += generateKeyShape(i, false) + ' ';
        }

        // Generate Black Keys
        // Iterate lines that have black keys
        BLACK_KEY_LINES.forEach(lineIdx => {
            bPath += generateKeyShape(lineIdx, true) + ' ';
        });

        return { whiteKeysPath: wPath, blackKeysPath: bPath };
    }, [generateKeyShape]);

    // Generate FILLED paths for ACTIVE keys
    const activeKeyShapes = useMemo(() => {
        if (activeNotes.size === 0) return [];

        const shapes: { d: string, color: string }[] = [];

        const getGridIndex = (noteId: number) => {
            const octave = Math.floor(noteId / 12);
            const noteInOctave = noteId % 12;
            const whiteIndices = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
            return (octave * 7) + whiteIndices[noteInOctave];
        };

        const isBlack = (noteId: number) => {
            const n = noteId % 12;
            return [1, 3, 6, 8, 10].includes(n);
        };

        activeNotes.forEach(noteId => {
            if (noteId > 24) return;

            const gridIdx = getGridIndex(noteId);
            const black = isBlack(noteId);
            const color = getMinimapColor(analysis.intervals.get(noteId));

            if (black) {
                const lineIdx = gridIdx + 1;
                const d = generateKeyShape(lineIdx, true);
                shapes.push({ d, color });
            } else {
                const d = generateKeyShape(gridIdx, false);
                shapes.push({ d, color });
            }
        });

        return shapes;
    }, [activeNotes, analysis, generateKeyShape]);

    return (
        <div
            ref={minimapRef}
            className="relative w-full cursor-pointer select-none rounded overflow-hidden"
            style={{ height: MINIMAP_HEIGHT, backgroundColor: 'transparent' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
                <defs>
                    <clipPath id="viewportClip">
                        <rect x={`${viewportPosition}%`} y="0" width={`${viewportWidth}%`} height="100" />
                    </clipPath>
                </defs>

                {/* Layer 0: Active Key FILLS (Behind Grid) */}
                <g>
                    {activeKeyShapes.map((s, i) => (
                        <path key={i} d={s.d} fill={s.color} stroke="none" vectorEffect="non-scaling-stroke" opacity="0.8" />
                    ))}
                </g>

                {/* Layer 1: Inactive Grid (Gray) */}
                <g stroke="#4b5563" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
                    <path vectorEffect="non-scaling-stroke" d={whiteKeysPath} />
                    <path vectorEffect="non-scaling-stroke" d={blackKeysPath} />
                </g>

                {/* Layer 2: Viewport Highlight (Light Gray) */}
                <g
                    stroke="#9db0ceff"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    clipPath="url(#viewportClip)"
                >
                    <path vectorEffect="non-scaling-stroke" d={whiteKeysPath} />
                    <path vectorEffect="non-scaling-stroke" d={blackKeysPath} />
                </g>
            </svg>
        </div>
    );
};

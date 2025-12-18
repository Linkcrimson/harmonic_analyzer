import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useHarmonic } from '../../context/HarmonicContext';

interface KeyboardMinimapProps {
    scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

// Constants for minimap rendering
const WHITE_KEY_COUNT = 15;
const BLACK_KEY_LINES = [1, 2, 4, 5, 6, 8, 9, 11, 12, 13];
const MINIMAP_HEIGHT = 40;
const BLACK_KEY_HEIGHT_PERCENT = 60;

// Function to map interval to CSS variable or color
const getIntervalColor = (interval?: string) => {
    switch (interval) {
        case 'root': return 'var(--col-root)';
        case 'third': return 'var(--col-third)';
        case 'fifth': return 'var(--col-fifth)';
        case 'seventh': return 'var(--col-seventh)';
        case 'ext': return 'var(--col-ext)';
        default: return '#3b82f6'; // Fallback blue
    }
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

    // Generate SVG path data for wireframe
    const { whiteKeysPath, blackKeysPath } = useMemo(() => {
        let wPath = '';
        let bPath = '';
        const wKeyWidth = 100 / WHITE_KEY_COUNT;

        // Draw Left Edge
        wPath += `M 0 0 L 0 100 `;

        // Draw Internal Vertical Lines
        for (let i = 1; i < WHITE_KEY_COUNT; i++) {
            const x = i * wKeyWidth;
            if (BLACK_KEY_LINES.includes(i)) {
                wPath += `M ${x} ${BLACK_KEY_HEIGHT_PERCENT} L ${x} 100 `;

                const bkWidth = wKeyWidth * 0.6;
                const xLeft = x - (bkWidth / 2);
                const xRight = x + (bkWidth / 2);

                bPath += `M ${xLeft} 0 L ${xLeft} ${BLACK_KEY_HEIGHT_PERCENT} L ${xRight} ${BLACK_KEY_HEIGHT_PERCENT} L ${xRight} 0 `;
            } else {
                wPath += `M ${x} 0 L ${x} 100 `;
            }
        }

        // Right/Bottom Edges
        wPath += `M 100 0 L 100 100 `;
        wPath += `M 0 100 L 100 100 `;

        return { whiteKeysPath: wPath, blackKeysPath: bPath };
    }, []);

    // Generate FILLED paths for ACTIVE keys
    const activeKeyShapes = useMemo(() => {
        if (activeNotes.size === 0) return [];

        const shapes: { d: string, color: string }[] = [];
        const wKeyWidth = 100 / WHITE_KEY_COUNT;

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
            const color = getIntervalColor(analysis.intervals.get(noteId));

            if (black) {
                const lineIdx = gridIdx + 1;
                const x = lineIdx * wKeyWidth;
                const bkWidth = wKeyWidth * 0.6;
                const xLeft = x - (bkWidth / 2);
                const xRight = x + (bkWidth / 2);

                // Closed Rect for fill
                const d = `M ${xLeft} 0 L ${xLeft} ${BLACK_KEY_HEIGHT_PERCENT} L ${xRight} ${BLACK_KEY_HEIGHT_PERCENT} L ${xRight} 0 Z`;
                shapes.push({ d, color });
            } else {
                const wL = gridIdx * wKeyWidth;
                const wR = (gridIdx + 1) * wKeyWidth;

                const leftLineIdx = gridIdx;
                const rightLineIdx = gridIdx + 1;

                const hasBlackLeft = BLACK_KEY_LINES.includes(leftLineIdx);
                const hasBlackRight = BLACK_KEY_LINES.includes(rightLineIdx);

                // Key visual boundaries (taking into account black keys eating into top width)
                const bkHalWidth = (wKeyWidth * 0.6) / 2;

                // Top Left X: if black key on left, start after it. Else start at line.
                const xTopLeft = hasBlackLeft ? wL + bkHalWidth : wL;
                // Top Right X: if black key on right, end before it.
                const xTopRight = hasBlackRight ? wR - bkHalWidth : wR;

                // Bottom is always full width
                // Shape: 
                // Move TopLeft -> Line Left/Down? 
                // Actually:
                // 1. Start TopLeft (at y=0)
                // 2. Down to BottomLeft? 
                //    Wait, complex shape.
                //    If hasBlackLeft:
                //       Start at (xTopLeft, 0) -> Down to (xTopLeft, height)? NO.
                //       White key goes AROUND black key.
                //       It occupies the space UNDER the black key half?
                //       No, in my wireframe logic, the black key is ON TOP.
                //       So for FILL, I can just fill the whole slot (wL to wR) and let Black Key draw ON TOP?
                //       YES. Much simpler. SVG Painter's algorithm.
                //       If I draw white key rect first, then black key rect.
                //       BUT, standard piano white keys are notched.
                //       If I fill a white key rect fully, it will show behind the adjacent black key?
                //       If black key is transparent/outlined, yes.
                //       My black keys are outlines in the WIREFRAME layer.
                //       In the ACTIVE layer, I am filling them.
                //       
                //       If key C is active (white) and C# is INACTIVE (transparent wireframe):
                //       If I fill C as a full rect, color will bleed into C# area. BAD.
                //       So I MUST cutout the shape.

                let d = '';

                // Start Top Left
                d += `M ${xTopLeft} 0 `;

                // If hasBlackLeft, we go Down to BlackKeyHeight, then Left to wL
                if (hasBlackLeft) {
                    d += `L ${xTopLeft} ${BLACK_KEY_HEIGHT_PERCENT} L ${wL} ${BLACK_KEY_HEIGHT_PERCENT} `;
                } else {
                    // straight down (implicit, next point controls)
                    // Actually simplest is trace the perimeter.
                }

                // Go to Bottom Left
                d += `L ${wL} 100 `;

                // Go to Bottom Right
                d += `L ${wR} 100 `;

                // Go to Top Right (complex path)
                if (hasBlackRight) {
                    // We are at Bottom Right (wR, 100).
                    // Up to BlackKeyHeight at wR
                    d += `L ${wR} ${BLACK_KEY_HEIGHT_PERCENT} `;
                    // Left to xTopRight
                    d += `L ${xTopRight} ${BLACK_KEY_HEIGHT_PERCENT} `;
                    // Up to 0
                    d += `L ${xTopRight} 0 `;
                } else {
                    d += `L ${wR} 0 `;
                }

                // Close to Start
                d += `Z`;

                shapes.push({ d, color });
            }
        });

        return shapes;
    }, [activeNotes, analysis]);

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
                        // Using opacity to blend nicely
                        <path key={i} d={s.d} fill={s.color} stroke="none" vectorEffect="non-scaling-stroke" opacity="0.8" />
                    ))}
                </g>

                {/* Layer 1: Inactive Grid (Gray) */}
                <g stroke="#4b5563" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
                    <path vectorEffect="non-scaling-stroke" d={whiteKeysPath} />
                    <path vectorEffect="non-scaling-stroke" d={blackKeysPath} />
                </g>

                {/* Layer 2: Viewport Highlight (Blue Glow) */}
                <g
                    stroke="#60a5fa"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    clipPath="url(#viewportClip)"
                    style={{ filter: 'drop-shadow(0 0 3px rgba(59, 130, 246, 0.8))' }}
                >
                    <path vectorEffect="non-scaling-stroke" d={whiteKeysPath} />
                    <path vectorEffect="non-scaling-stroke" d={blackKeysPath} />
                </g>
            </svg>
        </div>
    );
};

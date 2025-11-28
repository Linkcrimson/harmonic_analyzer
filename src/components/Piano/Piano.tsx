import React, { useMemo, memo, useRef, useState } from 'react';
import { useHarmonic } from '../../context/HarmonicContext';

const THEME_COLORS = {
    root: '#81c784',
    third: '#64b5f6',
    fifth: '#e57373',
    seventh: '#ffd54f',
    ext: '#ba68c8',
    active: '#3b82f6' // Default active blue
};

interface KeyProps {
    id: number;
    isWhite: boolean;
    isActive: boolean;
    intervalType?: string; // 'root', 'third', 'fifth', 'seventh', 'ext'
    label: string;
    blackKey?: {
        id: number;
        isActive: boolean;
        intervalType?: string;
        label: string;
    } | null;
    onInteraction: (e: React.SyntheticEvent, noteId: number) => void;
}

// Memoized Key Component
const Key: React.FC<KeyProps> = memo(({ id, isActive, intervalType, label, blackKey, onInteraction }) => {

    const touchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startPos = useRef<{ x: number, y: number } | null>(null);
    const isScrolling = useRef(false);

    const getKeyStyle = (active: boolean, type?: string, isBlack: boolean = false) => {
        if (!active) return {};

        const color = type && type in THEME_COLORS ? THEME_COLORS[type as keyof typeof THEME_COLORS] : THEME_COLORS.active;

        return {
            background: color,
            boxShadow: `0 0 15px ${color}`,
            borderColor: isBlack ? color : 'transparent',
            color: 'white',
            fontWeight: 'bold'
        };
    };

    const handleKeyDown = (e: React.KeyboardEvent, noteId: number) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onInteraction(e, noteId);
        }
    };

    const handleTouchStart = (e: React.TouchEvent, noteId: number) => {
        // Delay touch to detect scroll
        startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        isScrolling.current = false;

        touchTimeout.current = setTimeout(() => {
            if (!isScrolling.current) {
                onInteraction(e, noteId);
            }
        }, 75); // 75ms delay to detect scroll
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!startPos.current) return;
        const dx = Math.abs(e.touches[0].clientX - startPos.current.x);
        const dy = Math.abs(e.touches[0].clientY - startPos.current.y);

        if (dx > 10 || dy > 10) {
            isScrolling.current = true;
            if (touchTimeout.current) {
                clearTimeout(touchTimeout.current);
                touchTimeout.current = null;
            }
        }
    };

    const handleTouchEnd = (e: React.TouchEvent, noteId: number) => {
        if (touchTimeout.current) {
            // If timeout is still pending, it was a tap
            clearTimeout(touchTimeout.current);
            touchTimeout.current = null;
            if (!isScrolling.current) {
                onInteraction(e, noteId);
            }
        }
        startPos.current = null;
    };

    const handleMouseDown = (e: React.MouseEvent, noteId: number) => {
        // Mouse events are instant
        onInteraction(e, noteId);
    };

    return (
        <div
            className={`white-key relative flex-1 h-full border border-gray-800 rounded-b cursor-pointer flex items-end justify-center pb-2 text-sm text-gray-500 select-none transition-colors duration-100 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
            style={{
                zIndex: 1,
                background: !isActive ? 'linear-gradient(to bottom, #ffffff 0%, #e6e6e6 100%)' : undefined,
                touchAction: 'pan-x', // Allow horizontal scrolling
                ...getKeyStyle(isActive, intervalType)
            }}
            onMouseDown={(e) => handleMouseDown(e, id)}
            onTouchStart={(e) => handleTouchStart(e, id)}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => handleTouchEnd(e, id)}
            onKeyDown={(e) => handleKeyDown(e, id)}
            onContextMenu={(e) => e.preventDefault()} // Prevent context menu on long press
            role="button"
            aria-label={`${label} key`}
            tabIndex={0}
        >
            {label}

            {blackKey && (
                <div
                    className={`black-key absolute top-0 h-2/3 w-[60%] rounded-b border border-black cursor-pointer flex items-end justify-center pb-2 text-[10px] select-none transition-colors duration-100 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                    style={{
                        left: 0,
                        transform: 'translateX(-50%)',
                        zIndex: 10,
                        background: !blackKey.isActive ? 'linear-gradient(to bottom, #333 0%, #000 100%)' : undefined,
                        touchAction: 'pan-x',
                        ...getKeyStyle(blackKey.isActive, blackKey.intervalType, true)
                    }}
                    onMouseDown={(e) => handleMouseDown(e, blackKey.id)}
                    onTouchStart={(e) => handleTouchStart(e, blackKey.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={(e) => handleTouchEnd(e, blackKey.id)}
                    onKeyDown={(e) => handleKeyDown(e, blackKey.id)}
                    onContextMenu={(e) => e.preventDefault()}
                    role="button"
                    aria-label={`${blackKey.label} key`}
                    tabIndex={0}
                    onClick={(e) => e.stopPropagation()}
                >
                    {blackKey.label}
                </div>
            )}
        </div>
    );
});

interface KeyData {
    id: number;
    isWhite: boolean;
    isActive: boolean;
    intervalType?: string;
    label: string;
    blackKey: {
        id: number;
        isActive: boolean;
        intervalType?: string;
        label: string;
    } | null;
}

const octavePattern = [
    { noteIndex: 0, label: 'Do', hasBlackLeft: false },
    { noteIndex: 2, label: 'Re', hasBlackLeft: true },
    { noteIndex: 4, label: 'Mi', hasBlackLeft: true },
    { noteIndex: 5, label: 'Fa', hasBlackLeft: false },
    { noteIndex: 7, label: 'Sol', hasBlackLeft: true },
    { noteIndex: 9, label: 'La', hasBlackLeft: true },
    { noteIndex: 11, label: 'Si', hasBlackLeft: true }
];

const ScrollBar: React.FC<{ scrollContainerRef: React.RefObject<HTMLDivElement | null> }> = ({ scrollContainerRef }) => {
    const [isScrolling, setIsScrolling] = useState(false);
    const startX = useRef(0);
    const startScrollLeft = useRef(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (!scrollContainerRef.current) return;
        setIsScrolling(true);
        startX.current = e.touches[0].clientX;
        startScrollLeft.current = scrollContainerRef.current.scrollLeft;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!scrollContainerRef.current) return;
        const dx = e.touches[0].clientX - startX.current;
        scrollContainerRef.current.scrollLeft = startScrollLeft.current - dx;
    };

    const handleTouchEnd = () => {
        setIsScrolling(false);
    };

    return (
        <div
            className="w-full h-8 bg-[#222] border-b border-[#333] flex items-center justify-center relative overflow-hidden cursor-grab active:cursor-grabbing touch-none mb-1 rounded-t-lg"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Animated Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-[#333] to-transparent opacity-30 transition-transform duration-300 ${isScrolling ? 'scale-x-150' : 'scale-x-100'}`} />

            {/* Arrows */}
            <div className="flex items-center gap-4 text-gray-500 text-xs font-medium tracking-widest uppercase select-none pointer-events-none">
                <span className={`transition-opacity duration-300 ${isScrolling ? 'opacity-100 animate-pulse' : 'opacity-50'}`}>&lt;&lt;&lt;</span>
                <span>Scorri</span>
                <span className={`transition-opacity duration-300 ${isScrolling ? 'opacity-100 animate-pulse' : 'opacity-50'}`}>&gt;&gt;&gt;</span>
            </div>

            {/* Active Indicator Line */}
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 transition-opacity duration-300 ${isScrolling ? 'opacity-100' : 'opacity-0'}`} />
        </div>
    );
};

export const Piano: React.FC = () => {
    const { activeNotes, analysis, toggleNote } = useHarmonic();
    const { intervals, noteNames } = analysis;
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const keys = useMemo(() => {
        const generatedKeys: KeyData[] = [];
        const numOctaves = 2;

        for (let oct = 0; oct < numOctaves; oct++) {
            octavePattern.forEach(keyData => {
                const whiteNoteId = keyData.noteIndex + (oct * 12);

                // White Key Data
                const isWhiteActive = activeNotes.has(whiteNoteId);
                const whiteInterval = intervals.get(whiteNoteId); // e.g., 'root', 'third'

                let whiteLabel = '';
                if (isWhiteActive && noteNames.has(whiteNoteId)) {
                    whiteLabel = noteNames.get(whiteNoteId)!;
                } else if (keyData.noteIndex === 0) {
                    whiteLabel = `C${oct + 4}`;
                }

                // Black Key Data (if exists)
                let blackKey = null;
                if (keyData.hasBlackLeft) {
                    const blackNoteId = whiteNoteId - 1;
                    const isBlackActive = activeNotes.has(blackNoteId);
                    const blackInterval = intervals.get(blackNoteId);

                    let blackLabel = '';
                    if (isBlackActive && noteNames.has(blackNoteId)) {
                        blackLabel = noteNames.get(blackNoteId)!;
                    }

                    blackKey = {
                        id: blackNoteId,
                        isActive: isBlackActive,
                        intervalType: blackInterval,
                        label: blackLabel
                    };
                }

                generatedKeys.push({
                    id: whiteNoteId,
                    isWhite: true,
                    isActive: isWhiteActive,
                    intervalType: whiteInterval,
                    label: whiteLabel,
                    blackKey
                });
            });
        }

        // Final C
        const finalC = 24;
        const isFinalActive = activeNotes.has(finalC);
        const finalInterval = intervals.get(finalC);
        let finalLabel = 'C6';
        if (isFinalActive && noteNames.has(finalC)) {
            finalLabel = noteNames.get(finalC)!;
        }

        generatedKeys.push({
            id: finalC,
            isWhite: true,
            isActive: isFinalActive,
            intervalType: finalInterval,
            label: finalLabel,
            blackKey: null
        });

        return generatedKeys;
    }, [activeNotes, intervals, noteNames]);

    // Stable handler
    const handleInteraction = useMemo(() => (e: React.SyntheticEvent, noteId: number) => {
        e.stopPropagation();
        toggleNote(noteId);
    }, [toggleNote]);

    return (
        <div className="w-full flex flex-col">
            {/* Scroll Bar - Visible on Mobile/Tablet mainly, or always if overflow exists */}
            <div className="lg:hidden w-full">
                <ScrollBar scrollContainerRef={scrollContainerRef} />
            </div>

            <div
                ref={scrollContainerRef}
                className="overflow-x-auto hide-scroll pb-1 lg:pb-4 w-full flex justify-start lg:justify-center relative z-10 scroll-smooth"
            >
                <div className="w-full flex justify-start lg:justify-center">
                    <div id="keyboard" className="flex relative select-none h-32 lg:h-48 w-full min-w-[750px] lg:min-w-0 lg:max-w-[800px]" style={{ touchAction: 'pan-x' }}>
                        {keys.map(key => (
                            <Key
                                key={key.id}
                                {...key}
                                onInteraction={handleInteraction}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

import React, { useMemo, memo, useRef } from 'react';
import { useHarmonic, InputMode } from '../../context/HarmonicContext';

const THEME_COLORS = {
    root: '--col-root',
    third: '--col-third',
    fifth: '--col-fifth',
    seventh: '--col-seventh',
    ext: '--col-ext',
    active: '#3b82f6' // Default active blue - KEEP AS HEX if no theme variable exists for generic active
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
        isLocked: boolean;
        intervalType?: string;
        label: string;
    } | null;
    onInteractionStart: (e: React.SyntheticEvent, noteId: number) => void;
    onInteractionEnd: (e: React.SyntheticEvent, noteId: number) => void;
    inputMode: InputMode;
    isLocked: boolean;
}

// Memoized Key Component
const Key: React.FC<KeyProps> = memo(({ id, isActive, intervalType, label, blackKey, onInteractionStart, onInteractionEnd, inputMode, isLocked }) => {

    const lastTouchTime = useRef(0);
    const startPos = useRef<{ x: number, y: number } | null>(null);
    const isScrolling = useRef(false);

    const getColorValue = (type?: string) => {
        const color = type && type in THEME_COLORS ? THEME_COLORS[type as keyof typeof THEME_COLORS] : THEME_COLORS.active;
        return color.startsWith('--') ? `var(${color})` : color;
    };

    // Helper to render the active overlay
    const renderOverlay = (active: boolean, locked: boolean, type?: string) => {
        if (!active) return null;

        const colorValue = getColorValue(type);
        const isSmart = inputMode === 'smart' && !locked;

        const style: React.CSSProperties = {
            position: 'absolute',
            left: -1,
            right: -1,
            top: -1,
            // Height covers the key. For smart mode fill, we treat it differently or use the same overlay with animation
            height: 'calc(100% + 2px)',
            backgroundColor: colorValue,
            zIndex: 5, // Above key base (1 or 10), below label (10 or 20)
            pointerEvents: 'none',
            borderRadius: '0 0 4px 4px', // Standard rounded-b
        };

        if (isSmart) {
            style.transformOrigin = 'top';
            style.animation = 'fillUp 0.5s ease-out forwards';
            // For Smart mode, we want the text to be visible (white), handled by parent class or specific text color logic?
            // The overlay is background color.
        } else {
            // For non-smart active, it's a solid block. 
            // We might want to keep the box-shadow glow on the overlay or the container?
            // Let's put shadow on the overlay to avoid container modifications.
            style.boxShadow = `0 0 15px ${colorValue}`;
        }

        return <div style={style} className="rounded-b" />;
    };

    const handleKeyDown = (e: React.KeyboardEvent, noteId: number) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onInteractionStart(e, noteId);
            setTimeout(() => onInteractionEnd(e, noteId), 150); // Simulate tap
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        lastTouchTime.current = Date.now();
        startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        isScrolling.current = false;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!startPos.current) return;
        const dx = Math.abs(e.touches[0].clientX - startPos.current.x);
        const dy = Math.abs(e.touches[0].clientY - startPos.current.y);

        if (dx > 10 || dy > 10) {
            isScrolling.current = true;
        }
    };

    const handleTouchEnd = (e: React.TouchEvent, noteId: number) => {
        if (!isScrolling.current) {
            onInteractionEnd(e, noteId);
        }
        startPos.current = null;
        isScrolling.current = false;
    };

    const handleTouchStartInteraction = (e: React.TouchEvent, noteId: number) => {
        handleTouchStart(e);
        if (!isScrolling.current) {
            onInteractionStart(e, noteId);
        }
    }

    const handleMouseDown = (e: React.MouseEvent, noteId: number) => {
        // Ignore mouse events that fire immediately after a touch event (emulation)
        if (Date.now() - lastTouchTime.current < 500) return;
        onInteractionStart(e, noteId);
    };

    const handleMouseUp = (e: React.MouseEvent, noteId: number) => {
        if (Date.now() - lastTouchTime.current < 500) return;
        onInteractionEnd(e, noteId);
    }

    // Determine text color based on activity
    // When active, text should be white to contrast with color. When inactive, default gray.
    const getTextColorClass = (active: boolean) => active ? 'text-white' : 'text-gray-500';

    return (
        <div
            className={`white-key relative flex-1 h-full border border-gray-800 rounded-b cursor-pointer flex items-end justify-center pb-2 text-sm select-none transition-colors duration-100 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 bg-white ${getTextColorClass(isActive)}`}
            style={{
                zIndex: 1,
                // ALWAYS keep gradient. No dynamic background image removal.
                backgroundImage: 'linear-gradient(to bottom, #ffffff 0%, #e6e6e6 100%)',
                touchAction: 'pan-x',
            }}

            onMouseDown={(e) => handleMouseDown(e, id)}
            onMouseUp={(e) => handleMouseUp(e, id)}
            onMouseLeave={(e) => handleMouseUp(e, id)}
            onTouchStart={(e) => handleTouchStartInteraction(e, id)}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => handleTouchEnd(e, id)}
            onKeyDown={(e) => handleKeyDown(e, id)}
            onContextMenu={(e) => e.preventDefault()}
            role="button"
            aria-label={`${label} key`}
            tabIndex={0}
        >
            {/* Active Overlay for White Key */}
            {renderOverlay(isActive, isLocked, intervalType)}

            <div className="relative z-10 flex flex-col items-center justify-end h-full pointer-events-none">
                {label}
            </div>

            {blackKey && (
                <div
                    className={`black-key absolute -top-px h-2/3 w-[60%] rounded-b border border-black cursor-pointer flex items-end justify-center pb-2 text-[10px] select-none transition-colors duration-100 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 bg-black`}

                    style={{
                        left: 0,
                        transform: 'translateX(-50%)',
                        zIndex: 10,
                        // ALWAYS keep gradient/black background. 
                        backgroundImage: 'linear-gradient(to bottom, #333 0%, #000 100%)',
                        touchAction: 'pan-x',
                    }}

                    onMouseDown={(e) => handleMouseDown(e, blackKey.id)}
                    onMouseUp={(e) => handleMouseUp(e, blackKey.id)}
                    onMouseLeave={(e) => handleMouseUp(e, blackKey.id)}
                    onTouchStart={(e) => handleTouchStartInteraction(e, blackKey.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={(e) => handleTouchEnd(e, blackKey.id)}
                    onKeyDown={(e) => handleKeyDown(e, blackKey.id)}
                    onContextMenu={(e) => e.preventDefault()}
                    role="button"
                    aria-label={`${blackKey.label} key`}
                    tabIndex={0}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Active Overlay for Black Key */}
                    {renderOverlay(blackKey.isActive, blackKey.isLocked, blackKey.intervalType)}

                    <span className="relative z-20 pointer-events-none text-[10px] mb-2 font-medium opacity-90 text-white">
                        {blackKey.label}
                    </span>
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
        isLocked: boolean;
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

export const Piano = React.forwardRef<HTMLDivElement>((_props, ref) => {
    const { activeNotes, analysis, startInput, stopInput, inputMode, lockedNotes } = useHarmonic();
    const { intervals, noteNames } = analysis;

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
                        isLocked: lockedNotes.has(blackNoteId),
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
    }, [activeNotes, intervals, noteNames, lockedNotes]);

    // Stable handlers
    const handleInteractionStart = useMemo(() => (e: React.SyntheticEvent, noteId: number) => {
        e.stopPropagation();
        startInput(noteId, 'ui');
    }, [startInput]);

    const handleInteractionEnd = useMemo(() => (e: React.SyntheticEvent, noteId: number) => {
        e.stopPropagation();
        stopInput(noteId, 'ui');
    }, [stopInput]);

    return (
        <div className="w-full flex flex-col">
            <style>{`
                @keyframes fillUp {
                    from { transform: scaleY(0); }
                    to { transform: scaleY(1); }
                }
            `}</style>

            <div
                ref={ref}
                className="overflow-x-auto hide-scroll pb-1 pt-1 lg:pb-4 w-full flex justify-start lg:justify-center relative z-10"
            >
                <div className="w-full flex justify-start lg:justify-center">
                    <div id="keyboard" className="flex relative select-none h-32 lg:h-48 w-full min-w-[750px] lg:min-w-0 lg:max-w-[800px]" style={{ touchAction: 'pan-x' }}>
                        {keys.map(key => (
                            <Key
                                key={key.id}
                                {...key}
                                onInteractionStart={handleInteractionStart}
                                onInteractionEnd={handleInteractionEnd}
                                inputMode={inputMode}
                                isLocked={lockedNotes.has(key.id)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});

Piano.displayName = 'Piano';

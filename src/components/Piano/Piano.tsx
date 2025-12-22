import React, { useMemo, memo, useRef, useCallback } from 'react';
import { useHarmonic, InputMode } from '../../context/HarmonicContext';

const THEME_COLORS = {
    root: '--col-root',
    third: '--col-third',
    fifth: '--col-fifth',
    seventh: '--col-seventh',
    ext: '--col-ext',
    active: '#3b82f6'
};

// Helper to get CSS color value
const getColorValue = (type?: string) => {
    const color = type && type in THEME_COLORS ? THEME_COLORS[type as keyof typeof THEME_COLORS] : THEME_COLORS.active;
    return color.startsWith('--') ? `var(${color})` : color;
};

// Shared overlay renderer
const renderOverlay = (active: boolean, locked: boolean, type: string | undefined, inputMode: InputMode) => {
    if (!active) return null;

    const colorValue = getColorValue(type);
    const isSmart = inputMode === 'smart' && !locked;

    const style: React.CSSProperties = {
        position: 'absolute',
        left: -1,
        right: -1,
        top: -1,
        height: 'calc(100% + 2px)',
        backgroundColor: colorValue,
        zIndex: 5,
        pointerEvents: 'none',
        borderRadius: '0 0 4px 4px',
    };

    if (isSmart) {
        style.transformOrigin = 'top';
        style.animation = 'fillUp 0.5s ease-out forwards';
    } else {
        style.boxShadow = `0 0 15px ${colorValue}`;
    }

    return <div style={style} className="rounded-b" />;
};

// --- WHITE KEY COMPONENT ---
interface WhiteKeyProps {
    id: number;
    isActive: boolean;
    intervalType?: string;
    label: string;
    ariaLabel?: string;
    onInteractionStart: (e: React.SyntheticEvent, noteId: number) => void;
    onInteractionEnd: (e: React.SyntheticEvent, noteId: number) => void;
    inputMode: InputMode;
    isLocked: boolean;
}

const WhiteKey: React.FC<WhiteKeyProps> = memo(({ id, isActive, intervalType, label, ariaLabel, onInteractionStart, onInteractionEnd, inputMode, isLocked }) => {
    const lastTouchTime = useRef(0);
    const startPos = useRef<{ x: number, y: number } | null>(null);
    const isScrolling = useRef(false);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onInteractionStart(e, id);
            setTimeout(() => onInteractionEnd(e, id), 150);
        }
    }, [id, onInteractionStart, onInteractionEnd]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        lastTouchTime.current = Date.now();
        startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        isScrolling.current = false;
        onInteractionStart(e, id);
    }, [id, onInteractionStart]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!startPos.current) return;
        const dx = Math.abs(e.touches[0].clientX - startPos.current.x);
        const dy = Math.abs(e.touches[0].clientY - startPos.current.y);
        if (dx > 10 || dy > 10) {
            isScrolling.current = true;
        }
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (!isScrolling.current) {
            onInteractionEnd(e, id);
        }
        startPos.current = null;
        isScrolling.current = false;
    }, [id, onInteractionEnd]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (Date.now() - lastTouchTime.current < 500) return;
        onInteractionStart(e, id);
    }, [id, onInteractionStart]);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        if (Date.now() - lastTouchTime.current < 500) return;
        onInteractionEnd(e, id);
    }, [id, onInteractionEnd]);

    const textColorClass = isActive ? 'text-white' : 'text-gray-500';

    return (
        <button
            type="button"
            className={`white-key relative flex-1 h-full border border-gray-800 rounded-b cursor-pointer flex items-end justify-center pb-2 text-sm select-none transition-colors duration-100 outline-none focus-visible:shadow-[inset_0_0_0_6px_#2563eb] focus:z-10 bg-white ${textColorClass}`}
            style={{
                zIndex: 1,
                backgroundImage: 'linear-gradient(to bottom, #ffffff 0%, #e6e6e6 100%)',
                touchAction: 'pan-x',
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onKeyDown={handleKeyDown}
            onContextMenu={(e) => e.preventDefault()}
            aria-label={ariaLabel || `${label || 'Piano'} key`}
            aria-pressed={isActive}
        >
            {renderOverlay(isActive, isLocked, intervalType, inputMode)}
            <div className="relative z-10 flex flex-col items-center justify-end h-full pointer-events-none">
                {label}
            </div>
        </button>
    );
});
WhiteKey.displayName = 'WhiteKey';

// --- BLACK KEY COMPONENT ---
interface BlackKeyProps {
    id: number;
    isActive: boolean;
    intervalType?: string;
    label: string;
    ariaLabel?: string;
    leftOffset: string; // CSS left position (e.g., '12%')
    onInteractionStart: (e: React.SyntheticEvent, noteId: number) => void;
    onInteractionEnd: (e: React.SyntheticEvent, noteId: number) => void;
    inputMode: InputMode;
    isLocked: boolean;
}

const BlackKey: React.FC<BlackKeyProps> = memo(({ id, isActive, intervalType, label, ariaLabel, leftOffset, onInteractionStart, onInteractionEnd, inputMode, isLocked }) => {
    const lastTouchTime = useRef(0);
    const startPos = useRef<{ x: number, y: number } | null>(null);
    const isScrolling = useRef(false);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            onInteractionStart(e, id);
            setTimeout(() => onInteractionEnd(e, id), 150);
        }
    }, [id, onInteractionStart, onInteractionEnd]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        e.stopPropagation();
        lastTouchTime.current = Date.now();
        startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        isScrolling.current = false;
        onInteractionStart(e, id);
    }, [id, onInteractionStart]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!startPos.current) return;
        const dx = Math.abs(e.touches[0].clientX - startPos.current.x);
        const dy = Math.abs(e.touches[0].clientY - startPos.current.y);
        if (dx > 10 || dy > 10) {
            isScrolling.current = true;
        }
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        e.stopPropagation();
        if (!isScrolling.current) {
            onInteractionEnd(e, id);
        }
        startPos.current = null;
        isScrolling.current = false;
    }, [id, onInteractionEnd]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (Date.now() - lastTouchTime.current < 500) return;
        onInteractionStart(e, id);
    }, [id, onInteractionStart]);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (Date.now() - lastTouchTime.current < 500) return;
        onInteractionEnd(e, id);
    }, [id, onInteractionEnd]);

    return (
        <button
            type="button"
            className="black-key absolute h-2/3 rounded-b border border-black cursor-pointer flex items-end justify-center pb-2 text-[10px] select-none transition-colors duration-100 outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-blue-400 focus:z-[100] bg-black"
            style={{
                left: leftOffset,
                width: '4%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                backgroundImage: 'linear-gradient(to bottom, #333 0%, #000 100%)',
                touchAction: 'pan-x',
                top: 0,
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onKeyDown={handleKeyDown}
            onContextMenu={(e) => e.preventDefault()}
            aria-label={ariaLabel || `${label || 'Sharp/Flat'} key`}
            aria-pressed={isActive}
        >
            {renderOverlay(isActive, isLocked, intervalType, inputMode)}
            <span className="relative z-20 pointer-events-none text-[10px] mb-2 font-medium opacity-90 text-white">
                {label}
            </span>
        </button>
    );
});
BlackKey.displayName = 'BlackKey';

// --- DATA STRUCTURES ---
interface WhiteKeyData {
    id: number;
    isActive: boolean;
    intervalType?: string;
    label: string;
    ariaLabel?: string;
    isLocked: boolean;
}

interface BlackKeyData {
    id: number;
    isActive: boolean;
    intervalType?: string;
    label: string;
    ariaLabel?: string;
    isLocked: boolean;
    leftOffset: string;
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

// Calculate black key positions (percentage-based)
// 15 white keys total (7*2 + 1), each key is ~6.67% width
const WHITE_KEY_WIDTH_PERCENT = 100 / 15; // ~6.67%

// Black key positions relative to the keyboard
// For each octave, black keys are positioned at the LEFT edge of their adjacent white key
const getBlackKeyPositions = (): Map<number, string> => {
    const positions = new Map<number, string>();
    const numOctaves = 2;

    for (let oct = 0; oct < numOctaves; oct++) {
        const octaveOffset = oct * 7 * WHITE_KEY_WIDTH_PERCENT;

        // C#/Db - between C and D (index 1 in octave pattern ~= key 1)
        positions.set(1 + oct * 12, `${octaveOffset + 1 * WHITE_KEY_WIDTH_PERCENT}%`);
        // D#/Eb - between D and E (index 2)
        positions.set(3 + oct * 12, `${octaveOffset + 2 * WHITE_KEY_WIDTH_PERCENT}%`);
        // F#/Gb - between F and G (index 4)
        positions.set(6 + oct * 12, `${octaveOffset + 4 * WHITE_KEY_WIDTH_PERCENT}%`);
        // G#/Ab - between G and A (index 5)
        positions.set(8 + oct * 12, `${octaveOffset + 5 * WHITE_KEY_WIDTH_PERCENT}%`);
        // A#/Bb - between A and B (index 6)
        positions.set(10 + oct * 12, `${octaveOffset + 6 * WHITE_KEY_WIDTH_PERCENT}%`);
    }

    return positions;
};

const BLACK_KEY_POSITIONS = getBlackKeyPositions();

// --- MAIN PIANO COMPONENT ---
export const Piano = React.forwardRef<HTMLDivElement>((_props, ref) => {
    const { activeNotes, analysis, startInput, stopInput, inputMode, lockedNotes } = useHarmonic();
    const { intervals, noteNames } = analysis;

    const { whiteKeys, blackKeys } = useMemo(() => {
        const whites: WhiteKeyData[] = [];
        const blacks: BlackKeyData[] = [];
        const numOctaves = 2;

        for (let oct = 0; oct < numOctaves; oct++) {
            octavePattern.forEach(keyData => {
                const whiteNoteId = keyData.noteIndex + (oct * 12);
                const isWhiteActive = activeNotes.has(whiteNoteId);
                const whiteInterval = intervals.get(whiteNoteId);

                let whiteLabel = '';
                if (isWhiteActive && noteNames.has(whiteNoteId)) {
                    whiteLabel = noteNames.get(whiteNoteId)!;
                } else if (keyData.noteIndex === 0) {
                    whiteLabel = `C${oct + 4}`;
                }

                whites.push({
                    id: whiteNoteId,
                    isActive: isWhiteActive,
                    intervalType: whiteInterval,
                    label: whiteLabel,
                    ariaLabel: `${keyData.label} ${oct + 4}`,
                    isLocked: lockedNotes.has(whiteNoteId)
                });

                // Black key (if applicable)
                if (keyData.hasBlackLeft) {
                    const blackNoteId = whiteNoteId - 1;
                    const isBlackActive = activeNotes.has(blackNoteId);
                    const blackInterval = intervals.get(blackNoteId);

                    let blackLabel = '';
                    if (isBlackActive && noteNames.has(blackNoteId)) {
                        blackLabel = noteNames.get(blackNoteId)!;
                    }

                    const leftOffset = BLACK_KEY_POSITIONS.get(blackNoteId) || '0%';

                    // Calculate Black Key Name (e.g., Do Diesis 4)
                    // Note: noteIndex is the LEFT white key.
                    // 0 (Do) -> has no left black
                    // 2 (Re) -> Left black is Do# (C#)
                    let blackName = '';
                    if (keyData.noteIndex === 2) blackName = 'Do Diesis';
                    if (keyData.noteIndex === 4) blackName = 'Re Diesis';
                    if (keyData.noteIndex === 7) blackName = 'Fa Diesis';
                    if (keyData.noteIndex === 9) blackName = 'Sol Diesis';
                    if (keyData.noteIndex === 11) blackName = 'La Diesis';

                    blacks.push({
                        id: blackNoteId,
                        isActive: isBlackActive,
                        intervalType: blackInterval,
                        label: blackLabel,
                        ariaLabel: `${blackName} ${oct + 4}`,
                        isLocked: lockedNotes.has(blackNoteId),
                        leftOffset
                    });
                }
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

        whites.push({
            id: finalC,
            isActive: isFinalActive,
            intervalType: finalInterval,
            label: finalLabel,
            ariaLabel: 'Do 6',
            isLocked: lockedNotes.has(finalC)
        });

        return { whiteKeys: whites, blackKeys: blacks };
    }, [activeNotes, intervals, noteNames, lockedNotes]);

    const handleInteractionStart = useCallback((e: React.SyntheticEvent, noteId: number) => {
        e.stopPropagation();
        startInput(noteId, 'ui');
    }, [startInput]);

    const handleInteractionEnd = useCallback((e: React.SyntheticEvent, noteId: number) => {
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
                className="overflow-x-auto hide-scroll pb-1 pt-4 lg:pb-4 lg:pt-6 w-full flex justify-start lg:justify-center relative z-10"
            >
                <div className="w-full flex justify-start lg:justify-center">
                    <div
                        id="keyboard"
                        className="flex relative select-none h-32 lg:h-48 w-full min-w-[750px] lg:min-w-0 lg:max-w-[800px] overflow-visible focus-within:z-50"
                        style={{ touchAction: 'pan-x' }}
                        role="group"
                        aria-label="Piano keyboard"
                    >
                        {/* Render all keys in chromatic order for correct Tab sequence */}
                        {[...whiteKeys, ...blackKeys].sort((a, b) => a.id - b.id).map(key => {
                            if ('leftOffset' in key) {
                                return (
                                    <BlackKey
                                        key={key.id}
                                        {...key as BlackKeyData}
                                        onInteractionStart={handleInteractionStart}
                                        onInteractionEnd={handleInteractionEnd}
                                        inputMode={inputMode}
                                    />
                                );
                            }
                            return (
                                <WhiteKey
                                    key={key.id}
                                    {...key as WhiteKeyData}
                                    onInteractionStart={handleInteractionStart}
                                    onInteractionEnd={handleInteractionEnd}
                                    inputMode={inputMode}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
});

Piano.displayName = 'Piano';

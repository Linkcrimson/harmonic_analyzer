import React, { useMemo, memo } from 'react';
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
const Key: React.FC<KeyProps> = memo(({ id, isWhite, isActive, intervalType, label, blackKey, onInteraction }) => {

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
        e.preventDefault(); // Prevent mouse events emulation to avoid double-toggling
        onInteraction(e, noteId);
    };

    return (
        <div
            className={`white-key relative flex-1 h-full border border-gray-800 rounded-b cursor-pointer flex items-end justify-center pb-2 text-sm text-gray-500 select-none transition-colors duration-100 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
            style={{
                zIndex: 1,
                background: !isActive ? 'linear-gradient(to bottom, #ffffff 0%, #e6e6e6 100%)' : undefined,
                ...getKeyStyle(isActive, intervalType)
            }}
            onMouseDown={(e) => onInteraction(e, id)}
            onTouchStart={(e) => handleTouchStart(e, id)}
            onKeyDown={(e) => handleKeyDown(e, id)}
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
                        ...getKeyStyle(blackKey.isActive, blackKey.intervalType, true)
                    }}
                    onMouseDown={(e) => onInteraction(e, blackKey.id)}
                    onTouchStart={(e) => handleTouchStart(e, blackKey.id)}
                    onKeyDown={(e) => handleKeyDown(e, blackKey.id)}
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

export const Piano: React.FC = () => {
    const { activeNotes, analysis, toggleNote } = useHarmonic();
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
        <div className="overflow-x-auto hide-scroll pb-1 lg:pb-4 w-full flex justify-start lg:justify-center relative z-10">
            <div className="w-full flex justify-center">
                <div id="keyboard" className="flex relative select-none h-32 lg:h-48 w-full max-w-[600px]" style={{ touchAction: 'none' }}>
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
    );
};

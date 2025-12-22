import React, { useMemo, useState } from 'react';
import { useHarmonic } from '../../context/HarmonicContext';
import { useLanguage } from '../../context/LanguageContext';
import { Tooltip, TooltipInfo } from '../Tooltip';
import { NoteMarker } from './NoteMarker';
import { SectorArc } from './SectorArc';
import { ExtensionMarker } from './ExtensionMarker';
import { ChordOverlay } from './ChordOverlay';

interface HarmonicCircleProps {
    size?: number;
}

export const HarmonicCircle: React.FC<HarmonicCircleProps> = ({ size = 400 }) => {
    const { activeNotes, analysis, chordName, chordOptions, selectedOptionIndex } = useHarmonic();
    const { intervals, noteNames } = analysis;
    const { t } = useLanguage();

    // Configuration
    const center = size / 2;
    const radius = size * 0.39;

    // Helper to calculate point on circle
    const getPoint = (index: number, r: number = radius) => {
        const angleDeg = 90 - (index * 30);
        const angleRad = (angleDeg * Math.PI) / 180;
        return {
            x: center + r * Math.cos(angleRad),
            y: center + r * Math.sin(angleRad)
        };
    };

    // Find root note
    const rootNoteId = useMemo(() => {
        for (const [noteId, type] of intervals.entries()) {
            if (type === 'root') return noteId;
        }
        return null;
    }, [intervals]);

    // Build active intervals map
    const activeIntervals = useMemo(() => {
        const map = new Map<number, { noteId: number; type: string; name: string }>();
        if (rootNoteId === null) return map;

        const rootPitch = rootNoteId % 12;
        activeNotes.forEach(noteId => {
            const pitch = noteId % 12;
            const interval = (pitch - rootPitch + 12) % 12;
            const type = intervals.get(noteId) || 'ext';
            const name = noteNames.get(noteId) || '';
            map.set(interval, { noteId, type, name });
        });
        return map;
    }, [activeNotes, rootNoteId, intervals, noteNames]);

    // Context intervals for didactic explanations
    const contextIntervals = useMemo(() => {
        if (rootNoteId === null) return [];
        const rootPitch = rootNoteId % 12;
        return Array.from(activeNotes).map(n => (n % 12 - rootPitch + 12) % 12);
    }, [activeNotes, rootNoteId]);

    // Tooltip state
    const [hoveredInfo, setHoveredInfo] = useState<TooltipInfo | null>(null);
    const [isTooltipLocked, setIsTooltipLocked] = useState(false);
    const closeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearCloseTimeout = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
    };

    const handleMouseEnter = (title: string, content: React.ReactNode, e: React.MouseEvent) => {
        if (isTooltipLocked) return;
        clearCloseTimeout();
        setHoveredInfo({
            title,
            content,
            x: e.clientX,
            y: e.clientY,
            containerWidth: window.innerWidth,
            clientY: e.clientY
        });
    };

    const handleMouseLeave = () => {
        if (isTooltipLocked) return;
        clearCloseTimeout();
        closeTimeoutRef.current = setTimeout(() => {
            setHoveredInfo(null);
        }, 100);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        // Modal version doesn't need continuous coordinate updates
        if (hoveredInfo && !isTooltipLocked) {
            setHoveredInfo(prev => prev ? ({
                ...prev,
                x: e.clientX,
                y: e.clientY,
                containerWidth: window.innerWidth,
                clientY: e.clientY
            }) : null);
        }
    };

    const handleTriggerClick = (title: string, content: React.ReactNode, e: React.MouseEvent) => {
        clearCloseTimeout();
        setHoveredInfo({
            title,
            content,
            x: e.clientX,
            y: e.clientY,
            containerWidth: window.innerWidth,
            clientY: e.clientY
        });
        setIsTooltipLocked(true);
    };

    // Global tap-to-close for mobile & desktop
    React.useEffect(() => {
        const closeAll = () => {
            setHoveredInfo(null);
            setIsTooltipLocked(false);
        };
        const handler = (e: MouseEvent | TouchEvent) => {
            if (!(e.target as HTMLElement).closest('.tooltip-trigger') &&
                !(e.target as HTMLElement).closest('.tooltip-box')) {
                closeAll();
            }
        };

        window.addEventListener('touchstart', handler);
        window.addEventListener('mousedown', handler);
        return () => {
            window.removeEventListener('touchstart', handler);
            window.removeEventListener('mousedown', handler);
        };
    }, []);

    // Sector definitions
    const sectors = [
        { label: 'Root', range: [0, 0] as [number, number], type: 'root', colorVar: '--col-root', title: t('sectors.root.title'), description: t('sectors.root.desc') },
        { label: 'Thirds', range: [2, 5] as [number, number], type: 'third', colorVar: '--col-third', title: t('sectors.thirds.title'), description: t('sectors.thirds.desc') },
        { label: 'Fifths', range: [6, 8] as [number, number], type: 'fifth', colorVar: '--col-fifth', title: t('sectors.fifths.title'), description: t('sectors.fifths.desc') },
        { label: 'Sevenths', range: [9, 11] as [number, number], type: 'seventh', colorVar: '--col-seventh', title: t('sectors.sevenths.title'), description: t('sectors.sevenths.desc') },
    ];

    return (
        <div className="relative flex justify-center items-center p-0">
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${size} ${size}`}
                onMouseLeave={handleMouseLeave}
            >
                {/* Background Circle */}
                <circle cx={center} cy={center} r={radius} fill="none" stroke="#262626" strokeWidth="3" />

                {/* Render Sectors */}
                {sectors.map((sector) => {
                    const notesInSector: Array<{ idx: number; noteId: number; type: string; name: string }> = [];
                    for (let i = sector.range[0]; i <= sector.range[1]; i++) {
                        if (activeIntervals.has(i)) {
                            notesInSector.push({ idx: i, ...activeIntervals.get(i)! });
                        }
                    }

                    if (notesInSector.length > 0) {
                        // Active notes in sector -> render NoteMarkers
                        return notesInSector.map((note, i) => (
                            <NoteMarker
                                key={`${sector.label}-${i}`}
                                note={note}
                                pos={getPoint(note.idx)}
                                labelPos={getPoint(note.idx, radius + 30)}
                                contextIntervals={contextIntervals}
                                onMouseEnter={handleMouseEnter}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                                onClick={handleTriggerClick}
                            />
                        ));
                    } else {
                        // No active notes -> render SectorArc placeholder
                        return (
                            <SectorArc
                                key={sector.label}
                                sector={sector}
                                getPoint={getPoint}
                                radius={radius}
                                onMouseEnter={handleMouseEnter}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                                onClick={handleTriggerClick}
                            />
                        );
                    }
                })}

                {/* Extensions (notes outside defined sectors) */}
                {Array.from(activeIntervals.entries()).map(([idx, note]) => {
                    const inSector = sectors.some(s => idx >= s.range[0] && idx <= s.range[1]);
                    if (!inSector) {
                        return (
                            <ExtensionMarker
                                key={`ext-${idx}`}
                                idx={idx}
                                note={note}
                                pos={getPoint(idx)}
                                labelPos={getPoint(idx, radius + 30)}
                                contextIntervals={contextIntervals}
                                onMouseEnter={handleMouseEnter}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                                onClick={handleTriggerClick}
                            />
                        );
                    }
                    return null;
                })}
            </svg>

            {/* Center Chord Symbol */}
            <ChordOverlay
                chordName={chordName}
                chordOption={chordOptions[selectedOptionIndex]}
                radius={radius}
            />

            {/* Tooltip */}
            {hoveredInfo && (
                <Tooltip
                    info={hoveredInfo}
                    variant="modal"
                    onMouseEnter={clearCloseTimeout}
                    onMouseLeave={handleMouseLeave}
                />
            )}
        </div>
    );
};


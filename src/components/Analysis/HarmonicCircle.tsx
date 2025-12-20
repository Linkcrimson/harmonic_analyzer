import React, { useMemo, useState } from 'react';
import { useHarmonic } from '../../context/HarmonicContext';
import { ChordSymbol } from './ChordSymbol';
import { getDidacticExplanation } from '../../utils/didacticTooltips';
import { getIntervalColor } from '../../utils/intervalColors';
import { useLanguage } from '../../context/LanguageContext';
import { Tooltip, TooltipInfo } from '../Tooltip';

interface HarmonicCircleProps {
    size?: number;
}

export const HarmonicCircle: React.FC<HarmonicCircleProps> = ({ size = 400 }) => {
    const { activeNotes, analysis, chordName, chordOptions, selectedOptionIndex } = useHarmonic();
    const { intervals, noteNames } = analysis;
    const { language, t } = useLanguage();

    // Configuration
    const center = size / 2;
    const radius = size * 0.39; // Maximized to fit labels tightly

    // Helper to get color based on interval type
    const getColor = (type: string | undefined) => getIntervalColor(type);

    // Helper to calculate point on circle
    const getPoint = (index: number, r: number = radius) => {
        const angleDeg = 90 - (index * 30);
        const angleRad = (angleDeg * Math.PI) / 180;
        return {
            x: center + r * Math.cos(angleRad),
            y: center + r * Math.sin(angleRad)
        };
    };

    // Generate Sectors
    const rootNoteId = useMemo(() => {
        for (const [noteId, type] of intervals.entries()) {
            if (type === 'root') return noteId;
        }
        return null;
    }, [intervals]);

    const activeIntervals = useMemo(() => {
        const map = new Map<number, { noteId: number, type: string, name: string }>();
        if (rootNoteId === null) return map;

        const rootPitch = rootNoteId % 12;

        activeNotes.forEach(noteId => {
            const pitch = noteId % 12;
            let interval = (pitch - rootPitch + 12) % 12;

            const type = intervals.get(noteId) || 'ext';
            const name = noteNames.get(noteId) || '';

            map.set(interval, { noteId, type, name });
        });
        return map;
    }, [activeNotes, rootNoteId, intervals, noteNames]);

    const [hoveredInfo, setHoveredInfo] = useState<TooltipInfo | null>(null);

    // Context-Aware Interval Naming
    const contextIntervals = useMemo(() => {
        if (rootNoteId === null) return [];
        const rootPitch = rootNoteId % 12;
        return Array.from(activeNotes).map(n => (n % 12 - rootPitch + 12) % 12);
    }, [activeNotes, rootNoteId]);


    // Define Sectors
    const sectors = [
        {
            label: 'Root',
            range: [0, 0],
            type: 'root',
            colorVar: '--col-root',
            title: t('sectors.root.title'),
            description: t('sectors.root.desc')
        },
        {
            label: 'Thirds',
            range: [2, 5],
            type: 'third',
            colorVar: '--col-third',
            title: t('sectors.thirds.title'),
            description: t('sectors.thirds.desc')
        },
        {
            label: 'Fifths',
            range: [6, 8],
            type: 'fifth',
            colorVar: '--col-fifth',
            title: t('sectors.fifths.title'),
            description: t('sectors.fifths.desc')
        },
        {
            label: 'Sevenths',
            range: [9, 11],
            type: 'seventh',
            colorVar: '--col-seventh',
            title: t('sectors.sevenths.title'),
            description: t('sectors.sevenths.desc')
        },
    ];

    // Helper to draw arc
    const describeArc = (startIdx: number, endIdx: number, r: number) => {
        const start = getPoint(startIdx, r);
        const end = getPoint(endIdx, r);
        const largeArcFlag = Math.abs(endIdx - startIdx) * 30 > 180 ? 1 : 0;

        return [
            "M", start.x, start.y,
            "A", r, r, 0, largeArcFlag, 0, end.x, end.y
        ].join(" ");
    };

    const handleMouseEnter = (title: string, content: React.ReactNode, e: React.MouseEvent) => {
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
        setHoveredInfo(null);
    };

    // Global tap-to-close for mobile
    React.useEffect(() => {
        const closeAll = () => setHoveredInfo(null);
        window.addEventListener('touchstart', (e) => {
            if (!(e.target as HTMLElement).closest('.tooltip-trigger') && !(e.target as HTMLElement).closest('.tooltip-box')) {
                closeAll();
            }
        });
        return () => window.removeEventListener('touchstart', () => { });
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (hoveredInfo) {
            setHoveredInfo(prev => prev ? ({
                ...prev,
                x: e.clientX,
                y: e.clientY,
                containerWidth: window.innerWidth,
                clientY: e.clientY
            }) : null);
        }
    };

    return (
        <div className="relative flex justify-center items-center p-0">
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${size} ${size}`}
                onMouseLeave={handleMouseLeave}
            >
                {/* Background Circle (Thin) */}
                <circle cx={center} cy={center} r={radius} fill="none" stroke="#262626" strokeWidth="3" />

                {/* Render Sectors or Active Points */}
                {sectors.map((sector) => {
                    const notesInSector = [];
                    for (let i = sector.range[0]; i <= sector.range[1]; i++) {
                        if (activeIntervals.has(i)) {
                            notesInSector.push({ idx: i, ...activeIntervals.get(i)! });
                        }
                    }

                    if (notesInSector.length > 0) {
                        // COLLAPSED STATE: Draw Points
                        return notesInSector.map((note, i) => {
                            const pos = getPoint(note.idx);
                            const labelPos = getPoint(note.idx, radius + 30);
                            const didactic = getDidacticExplanation(note.idx, contextIntervals, language);
                            const content = (
                                <div>
                                    <div className="font-bold text-white mb-1">{note.name}</div>
                                    <div className="text-gray-300">{didactic.title}</div>
                                    <div className="text-xs text-gray-400 mt-1">{note.idx} {note.idx === 1 ? t('general.semitone') : t('general.semitones')}</div>
                                    <div className="text-xs text-gray-500 mt-2 border-t border-gray-700 pt-1 text-left leading-relaxed">
                                        {didactic.description}
                                    </div>
                                </div>
                            );

                            return (
                                <g key={`${sector.label}-${i}`}>
                                    {/* GHOST HIT AREA */}
                                    <circle
                                        cx={pos.x}
                                        cy={pos.y}
                                        r={25}
                                        fill="transparent"
                                        stroke="none"
                                        onMouseEnter={(e) => handleMouseEnter(didactic.title, content, e)}
                                        onMouseMove={handleMouseMove}
                                        onMouseLeave={handleMouseLeave}
                                        style={{ cursor: 'help' }}
                                        className="tooltip-trigger"
                                    />

                                    {/* Visible Marker */}
                                    <circle
                                        cx={pos.x}
                                        cy={pos.y}
                                        r={note.idx === 0 ? 10 : 7}
                                        fill={getColor(note.type)}
                                        stroke="none"
                                        pointerEvents="none"
                                    />
                                    {/* Label */}
                                    <text
                                        x={labelPos.x}
                                        y={labelPos.y}
                                        fill={getColor(note.type)}
                                        fontSize="16"
                                        fontFamily="Inter, sans-serif"
                                        fontWeight="700"
                                        textAnchor="middle"
                                        alignmentBaseline="middle"
                                        pointerEvents="none"
                                    >
                                        {note.name}
                                    </text>
                                </g>
                            );
                        });
                    } else {
                        // EXPANDED STATE: Draw Arc
                        if (sector.type === 'root') {
                            const pos = getPoint(0);
                            return (
                                <g key={sector.label}>
                                    <circle
                                        cx={pos.x}
                                        cy={pos.y}
                                        r={20}
                                        fill="transparent"
                                        stroke="none"
                                        onMouseEnter={(e) => handleMouseEnter(sector.title, sector.description, e)}
                                        onMouseMove={handleMouseMove}
                                        onMouseLeave={handleMouseLeave}
                                        style={{ cursor: 'help' }}
                                        className="tooltip-trigger"
                                    />
                                    <circle
                                        cx={pos.x}
                                        cy={pos.y}
                                        r={8}
                                        fill="none"
                                        stroke={`var(${sector.colorVar})`}
                                        strokeWidth="3"
                                        opacity="0.3"
                                        pointerEvents="none"
                                    />
                                </g>
                            );
                        }

                        const d = describeArc(sector.range[0], sector.range[1], radius);
                        return (
                            <g key={sector.label}>
                                <path
                                    d={d}
                                    fill="none"
                                    stroke="transparent"
                                    strokeWidth="40"
                                    strokeLinecap="round"
                                    onMouseEnter={(e) => handleMouseEnter(sector.title, sector.description, e)}
                                    onMouseMove={handleMouseMove}
                                    onMouseLeave={handleMouseLeave}
                                    style={{ cursor: 'help' }}
                                    className="tooltip-trigger"
                                />
                                <path
                                    d={d}
                                    fill="none"
                                    stroke={`var(${sector.colorVar})`}
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    opacity="0.3"
                                    pointerEvents="none"
                                />
                            </g>
                        );
                    }
                })}

                {/* Handle Extensions */}
                {Array.from(activeIntervals.entries()).map(([idx, note]) => {
                    const inSector = sectors.some(s => idx >= s.range[0] && idx <= s.range[1]);
                    if (!inSector) {
                        const pos = getPoint(idx);
                        const labelPos = getPoint(idx, radius + 30);
                        const didactic = getDidacticExplanation(idx, contextIntervals, language);

                        const content = (
                            <div>
                                <div className="font-bold text-white mb-1">{note.name}</div>
                                <div className="text-gray-300">{didactic.title}</div>
                                <div className="text-xs text-gray-400 mt-1">{idx} {idx === 1 ? t('general.semitone') : t('general.semitones')}</div>
                                <div className="text-xs text-gray-500 mt-2 border-t border-gray-700 pt-1 text-left leading-relaxed">
                                    {didactic.description}
                                </div>
                            </div>
                        );

                        return (
                            <g key={`ext-${idx}`}>
                                <circle
                                    cx={pos.x}
                                    cy={pos.y}
                                    r={25}
                                    fill="transparent"
                                    stroke="none"
                                    onMouseEnter={(e) => handleMouseEnter(didactic.title, content, e)}
                                    onMouseMove={handleMouseMove}
                                    onMouseLeave={handleMouseLeave}
                                    style={{ cursor: 'help' }}
                                    className="tooltip-trigger"
                                />
                                <circle
                                    cx={pos.x}
                                    cy={pos.y}
                                    r={7}
                                    fill="var(--col-ext)"
                                    stroke="none"
                                    pointerEvents="none"
                                />
                                <text
                                    x={labelPos.x}
                                    y={labelPos.y}
                                    fill="var(--col-ext)"
                                    fontSize="16"
                                    fontFamily="Inter, sans-serif"
                                    fontWeight="600"
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                    pointerEvents="none"
                                >
                                    {note.name}
                                </text>
                            </g>
                        );
                    }
                    return null;
                })}
            </svg>

            {/* Center Chord Symbol Overlay */}
            <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none flex justify-center items-center"
                style={{ width: radius * 1.5, height: radius * 1.5 }}
            >
                {chordName !== '--' && chordOptions[selectedOptionIndex] && (
                    <div
                        className="font-bold text-white drop-shadow-lg transition-all duration-200"
                        style={{
                            fontSize: `${Math.max(2.5, 5 - (chordName.length * 0.15))}rem`
                        }}
                    >
                        <ChordSymbol option={chordOptions[selectedOptionIndex]} />
                    </div>
                )}
            </div>

            {/* Custom Tooltip Overlay */}
            {hoveredInfo && <Tooltip info={hoveredInfo} />}
        </div>
    );
};

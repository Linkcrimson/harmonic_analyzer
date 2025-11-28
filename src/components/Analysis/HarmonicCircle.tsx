import React, { useMemo, useState } from 'react';
import { useHarmonic } from '../../context/HarmonicContext';
import { ChordSymbol } from './ChordSymbol';

interface HarmonicCircleProps {
    size?: number;
}

export const HarmonicCircle: React.FC<HarmonicCircleProps> = ({ size = 400 }) => {
    const { activeNotes, analysis, chordName, chordOptions, selectedOptionIndex } = useHarmonic();
    const { intervals, noteNames } = analysis;

    // Configuration
    const center = size / 2;
    const radius = size * 0.39; // Maximized to fit labels tightly

    // Helper to get color based on interval type
    const getColor = (type: string | undefined) => {
        switch (type) {
            case 'root': return 'var(--col-root)';
            case 'third': return 'var(--col-third)';
            case 'fifth': return 'var(--col-fifth)';
            case 'seventh': return 'var(--col-seventh)';
            case 'ext': return 'var(--col-ext)';
            default: return '#333'; // Inactive/Empty
        }
    };

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

    const [hoveredInfo, setHoveredInfo] = useState<{ title: string; content: React.ReactNode; x: number; y: number } | null>(null);

    // Context-Aware Interval Naming
    const getIntervalName = (idx: number, type: string) => {
        const baseNames = [
            "Fondamentale", "Seconda Minore", "Seconda Maggiore", "Terza Minore", "Terza Maggiore",
            "Quarta Giusta", "Tritono", "Quinta Giusta", "Sesta Minore", "Sesta Maggiore",
            "Settima Minore", "Settima Maggiore"
        ];

        if (idx === 6 && type === 'fifth') return "Quinta Diminuita";
        if (idx === 8 && type === 'fifth') return "Quinta Aumentata";
        if (idx === 9 && type === 'seventh') return "Settima Diminuita";

        if (idx === 2 && type === 'third') return "Sus 2";
        if (idx === 5 && type === 'third') return "Sus 4";

        return baseNames[idx] || "";
    };

    // Define Sectors
    const sectors = [
        {
            label: 'Root',
            range: [0, 0],
            type: 'root',
            colorVar: '--col-root',
            title: 'Fondamentale',
            description: 'La nota generatrice dell\'accordo, il punto di riferimento da cui si calcolano tutti gli intervalli.'
        },
        {
            label: 'Thirds',
            range: [2, 5],
            type: 'third',
            colorVar: '--col-third',
            title: 'Area Modale (3a/Sus)',
            description: 'Definisce il modo (Maggiore/Minore) o la sospensione. Include 2a Maggiore, 3a Minore, 3a Maggiore e 4a Giusta.'
        },
        {
            label: 'Fifths',
            range: [6, 8],
            type: 'fifth',
            colorVar: '--col-fifth',
            title: 'Area di Stabilità (5a)',
            description: 'Determina la stabilità o tensione. Include il Tritono (dim), la 5a Giusta (perfetta) e la 5a Aumentata (aug).'
        },
        {
            label: 'Sevenths',
            range: [9, 11],
            type: 'seventh',
            colorVar: '--col-seventh',
            title: 'Area Funzionale (7a)',
            description: 'Definisce la funzione armonica. Include la 6a Maggiore (o 7a dim), la 7a Minore e la 7a Maggiore.'
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
        const svgRect = e.currentTarget.closest('svg')?.getBoundingClientRect();
        if (svgRect) {
            setHoveredInfo({
                title,
                content,
                x: e.clientX - svgRect.left,
                y: e.clientY - svgRect.top
            });
        }
    };

    const handleMouseLeave = () => {
        setHoveredInfo(null);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (hoveredInfo) {
            const svgRect = e.currentTarget.closest('svg')?.getBoundingClientRect();
            if (svgRect) {
                setHoveredInfo(prev => prev ? ({
                    ...prev,
                    x: e.clientX - svgRect.left,
                    y: e.clientY - svgRect.top
                }) : null);
            }
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
                            const intervalName = getIntervalName(note.idx, note.type);
                            const content = (
                                <div>
                                    <div className="font-bold text-white mb-1">{note.name}</div>
                                    <div className="text-gray-300">{intervalName}</div>
                                    <div className="text-xs text-gray-400 mt-1">{note.idx} semiton{note.idx === 1 ? 'o' : 'i'}</div>
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
                                        onMouseEnter={(e) => handleMouseEnter(sector.title, content, e)}
                                        onMouseMove={handleMouseMove}
                                        onMouseLeave={handleMouseLeave}
                                        style={{ cursor: 'help' }}
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
                        const intervalName = getIntervalName(idx, note.type);
                        const content = (
                            <div>
                                <div className="font-bold text-white mb-1">{note.name}</div>
                                <div className="text-gray-300">{intervalName}</div>
                                <div className="text-xs text-gray-400 mt-1">{idx} semiton{idx === 1 ? 'o' : 'i'}</div>
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
                                    onMouseEnter={(e) => handleMouseEnter("Estensione", content, e)}
                                    onMouseMove={handleMouseMove}
                                    onMouseLeave={handleMouseLeave}
                                    style={{ cursor: 'help' }}
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
            {hoveredInfo && (
                <div
                    className="absolute z-50 pointer-events-none px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] text-sm text-gray-200 max-w-[220px] text-center backdrop-blur-sm"
                    style={{
                        left: hoveredInfo.x,
                        top: hoveredInfo.y - 15, // Offset slightly above cursor
                        transform: 'translate(-50%, -100%)' // Center horizontally, position above
                    }}
                >
                    <div className="font-bold text-[#e0e0e0] mb-2 uppercase tracking-wider text-xs border-b border-[#333] pb-1">
                        {hoveredInfo.title}
                    </div>
                    <div className="leading-relaxed">
                        {hoveredInfo.content}
                    </div>
                    <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-3 h-3 bg-[#1a1a1a] border-r border-b border-[#333]"></div>
                </div>
            )}
        </div>
    );
};

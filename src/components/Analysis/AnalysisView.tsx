import React, { useState, useMemo } from 'react';
import { useHarmonic } from '../../context/HarmonicContext';
import { HarmonicCircle } from './HarmonicCircle';
import { ChordHeader } from './ChordHeader';
import { AnalysisGrid } from './AnalysisGrid';
import { ChordAlternatives } from './ChordAlternatives';
import { Header } from '../Header';

type ViewMode = 'circle' | 'cards';

export const AnalysisView: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('circle');
    const { activeNotes, analysis } = useHarmonic();

    // --- Dynamic Icon Logic ---

    // 1. Cards Icon (shows active analysis components)
    const cardsIconColors = useMemo(() => {
        const { rootName, quality, stability, function: func, extensions } = analysis;
        return {
            root: rootName !== '--' ? '#81c784' : '#333',
            quality: quality !== '--' ? '#64b5f6' : '#333',
            stability: (stability !== '--' && stability !== 'Omessa') ? '#e57373' : '#333',
            func: (func !== '--' && func !== 'Triade') ? '#ffd54f' : '#333',
            ext: extensions.length > 0 ? '#ba68c8' : '#333'
        };
    }, [analysis]);

    // 2. Circle Icon (shows active notes on a mini circle)
    const circleIconPoints = useMemo(() => {
        if (activeNotes.size === 0) return [];

        const getColor = (type: string | undefined) => {
            switch (type) {
                case 'root': return '#81c784';
                case 'third': return '#64b5f6';
                case 'fifth': return '#e57373';
                case 'seventh': return '#ffd54f';
                case 'ext': return '#ba68c8';
                default: return '#e0e0e0';
            }
        };

        return Array.from(activeNotes).map((note: number) => {
            const pitch = note % 12;
            const angleDeg = (pitch * 30) - 90; // -90 to start at top (C)
            const angleRad = (angleDeg * Math.PI) / 180;
            const r = 8; // radius of mini circle
            const type = analysis.intervals.get(note);

            return {
                x: 10 + r * Math.cos(angleRad),
                y: 10 + r * Math.sin(angleRad),
                color: getColor(type)
            };
        });
    }, [activeNotes, analysis.intervals]);


    return (
        <div className="flex flex-col gap-3 md:gap-6 relative">
            {/* Header Row with Toggle Button */}
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <Header />
                </div>

                {/* Toggle Button */}
                <button
                    onClick={() => setViewMode(prev => prev === 'circle' ? 'cards' : 'circle')}
                    className="ml-4 p-2 rounded-xl bg-[#1a1a1a] border border-[#333] hover:bg-[#252525] transition-colors group"
                    title={viewMode === 'circle' ? "Visualizza Schede" : "Visualizza Cerchio"}
                >
                    {viewMode === 'circle' ? (
                        // Show "Cards" Icon
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <rect x="2" y="2" width="9" height="9" rx="2" fill={cardsIconColors.root} />
                            <rect x="13" y="2" width="9" height="9" rx="2" fill={cardsIconColors.quality} />
                            <rect x="2" y="13" width="9" height="9" rx="2" fill={cardsIconColors.stability} />
                            <rect x="13" y="13" width="9" height="9" rx="2" fill={cardsIconColors.func} />
                            {/* Small bar for extensions if needed, or just the 4 grid items */}
                        </svg>
                    ) : (
                        // Show "Circle" Icon
                        <svg width="24" height="24" viewBox="0 0 20 20">
                            <circle cx="10" cy="10" r="9" stroke="#555" strokeWidth="1.5" fill="none" />
                            {circleIconPoints.map((p, i) => (
                                <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={p.color} />
                            ))}
                        </svg>
                    )}
                </button>
            </div>

            {/* Main Content Area */}
            <div className="min-h-[400px] flex flex-col">
                {viewMode === 'circle' ? (
                    <div className="flex-1 flex justify-center items-center">
                        {/* Pass a responsive size or handle it via CSS in HarmonicCircle */}
                        <div className="w-full max-w-[400px] aspect-square">
                            {/* We might need to make HarmonicCircle responsive. For now, let's try a fixed size that fits or 100% */}
                            <HarmonicCircle size={360} />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        <ChordHeader />
                        <AnalysisGrid />
                    </div>
                )}
            </div>

            {/* Footer: Alternatives (Always Visible) */}
            <div className="mt-auto pt-4 border-t border-[#222]">
                <ChordAlternatives />
            </div>
        </div>
    );
};

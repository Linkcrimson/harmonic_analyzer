import React, { useState, useMemo } from 'react';
import { useHarmonic } from '../../context/HarmonicContext';
import { HarmonicCircle } from './HarmonicCircle';
import { ChordHeader } from './ChordHeader';
import { AnalysisGrid } from './AnalysisGrid';
import { ChordAlternatives } from './ChordAlternatives';
import { Header } from '../Header';
import { SettingsModal } from '../SettingsModal';

type ViewMode = 'circle' | 'cards';

export const AnalysisView: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('circle');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { activeNotes, analysis, forceBassAsRoot, toggleBassAsRoot } = useHarmonic();

    // --- Dynamic Icon Logic ---

    // 1. Cards Icon (shows active analysis components)
    const cardsIconColors = useMemo(() => {
        const { flags } = analysis;
        return {
            root: flags.isRootActive ? 'var(--col-root)' : '#333',
            quality: flags.isThirdActive ? 'var(--col-third)' : '#333',
            stability: flags.isFifthActive ? 'var(--col-fifth)' : '#333',
            func: flags.isSeventhActive ? 'var(--col-seventh)' : '#333',
            ext: analysis.extensions.length > 0 ? 'var(--col-ext)' : '#333'
        };
    }, [analysis]);

    // 2. Circle Icon (shows active notes on a mini circle)
    const circleIconPoints = useMemo(() => {
        if (activeNotes.size === 0) return [];

        const getColor = (type: string | undefined) => {
            switch (type) {
                case 'root': return 'var(--col-root)';
                case 'third': return 'var(--col-third)';
                case 'fifth': return 'var(--col-fifth)';
                case 'seventh': return 'var(--col-seventh)';
                case 'ext': return 'var(--col-ext)';
                default: return '#e0e0e0';
            }
        };

        // Find root pitch to calculate relative intervals
        let rootPitch = 0;
        for (const note of activeNotes) {
            if (analysis.intervals.get(note) === 'root') {
                rootPitch = note % 12;
                break;
            }
        }

        return Array.from(activeNotes).map((note: number) => {
            const pitch = note % 12;
            // Calculate interval relative to root
            const interval = (pitch - rootPitch + 12) % 12;

            // Match HarmonicCircle orientation: Root (interval 0) at bottom (90 deg)
            // Formula: 90 - (interval * 30)
            const angleDeg = 90 - (interval * 30);
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
        <div className="flex flex-col gap-1 md:gap-6 relative">
            {/* Header Row with Toggle Button */}
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <Header />
                </div>

                <div className="flex items-center gap-2">
                    {/* Bass as Root Toggle */}
                    <button
                        onClick={toggleBassAsRoot}
                        className={`p-2 rounded-xl border transition-all group ${forceBassAsRoot
                            ? 'bg-blue-900/40 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                            : 'bg-[#1a1a1a] border-[#333] hover:bg-[#252525] text-gray-400'
                            }`}
                        title={forceBassAsRoot ? "Basso = Fondamentale (Bass Locked)" : "Fondamentale Automatica (Smart Root)"}
                    >
                        {/* Variant 3: The Signal (Integrated SVG with transition classes) */}
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-all duration-300">
                            {/* Top Shape (The Chord/Root) */}
                            <circle
                                cx="12" cy="8" r={forceBassAsRoot ? "4" : "5.5"}
                                fill={forceBassAsRoot ? "none" : "currentColor"}
                                stroke={forceBassAsRoot ? "currentColor" : "none"}
                                strokeWidth={forceBassAsRoot ? "2" : "0"}
                                className="transition-all duration-500 ease-out"
                            />

                            {/* Bottom Bar (The Bass) */}
                            <rect
                                x="4" y={forceBassAsRoot ? "15" : "16"}
                                width="16" height={forceBassAsRoot ? "6" : "4"}
                                rx="2"
                                fill={forceBassAsRoot ? "currentColor" : "none"}
                                stroke={forceBassAsRoot ? "none" : "currentColor"}
                                strokeWidth={forceBassAsRoot ? "0" : "2"}
                                className="transition-all duration-500 ease-out"
                            />

                            {/* Link (Slash) - Visible in Smart Mode */}
                            <line
                                x1="12" y1="12" x2="12" y2="16"
                                stroke="currentColor"
                                strokeWidth="1"
                                strokeDasharray="2 2"
                                className={`transition-opacity duration-300 ${forceBassAsRoot ? 'opacity-0' : 'opacity-40'}`}
                            />
                        </svg>
                    </button>

                    {/* View Mode Toggle */}
                    <button
                        onClick={() => setViewMode(prev => prev === 'circle' ? 'cards' : 'circle')}
                        className={`p-2 rounded-xl border transition-colors group ${viewMode === 'cards'
                            ? 'bg-[#1a1a1a] border-[#333] hover:bg-[#252525]'
                            : 'bg-[#1a1a1a] border-[#333] hover:bg-[#252525]'
                            }`} // Can add active state styles if desired
                        title={viewMode === 'circle' ? "Visualizza Schede" : "Visualizza Cerchio"}
                    >
                        {viewMode === 'circle' ? (
                            // Show "Cards" Icon
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <rect x="2" y="2" width="9" height="9" rx="2" fill={cardsIconColors.root} />
                                <rect x="13" y="2" width="9" height="9" rx="2" fill={cardsIconColors.quality} />
                                <rect x="2" y="13" width="9" height="9" rx="2" fill={cardsIconColors.stability} />
                                <rect x="13" y="13" width="9" height="9" rx="2" fill={cardsIconColors.func} />
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

                    {/* Settings Button */}
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2 rounded-xl bg-[#1a1a1a] border border-[#333] hover:bg-[#252525] text-gray-400 hover:text-white transition-colors"
                        title="Impostazioni"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>

                    <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-0">
                {viewMode === 'circle' ? (
                    <div className="flex-1 flex justify-center items-center">
                        {/* Pass a responsive size or handle it via CSS in HarmonicCircle */}
                        <div className="w-full max-w-[320px] md:max-w-[440px] aspect-square mt-8 md:mt-0">
                            {/* We might need to make HarmonicCircle responsive. For now, let's try a fixed size that fits or 100% */}
                            <HarmonicCircle size={420} />
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

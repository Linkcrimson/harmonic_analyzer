import React, { useMemo } from 'react';
import { useHarmonic } from '../../context/HarmonicContext';
import { useLanguage } from '../../context/LanguageContext';
import { Tooltip, TooltipInfo } from '../Tooltip';
import { getIntervalColor } from '../../utils/intervalColors';

interface ViewToggleProps {
    viewMode: 'circle' | 'cards';
    setViewMode: (mode: 'circle' | 'cards') => void;
    activeTooltip: { type: string; info: TooltipInfo } | null;
    onOpenTooltip: (type: string, info: TooltipInfo) => void;
    onCancelClose: () => void;
    onScheduleClose: () => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
    viewMode,
    setViewMode,
    activeTooltip,
    onOpenTooltip,
    onCancelClose,
    onScheduleClose
}) => {
    const { activeNotes, analysis } = useHarmonic();
    const { language } = useLanguage();

    // --- Dynamic Icon Logic ---

    // 1. Cards Icon Colors
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

    // 2. Circle Icon Points
    const circleIconPoints = useMemo(() => {
        if (activeNotes.size === 0) return [];

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
            const interval = (pitch - rootPitch + 12) % 12;
            // Match HarmonicCircle orientation: Root (interval 0) at bottom (90 deg)
            const angleDeg = 90 - (interval * 30);
            const angleRad = (angleDeg * Math.PI) / 180;
            const r = 8;
            const type = analysis.intervals.get(note);

            return {
                x: 10 + r * Math.cos(angleRad),
                y: 10 + r * Math.sin(angleRad),
                color: getIntervalColor(type)
            };
        });
    }, [activeNotes, analysis.intervals]);


    const getContent = () => (
        <div className="flex flex-col gap-3 text-left">
            <div
                className={`cursor-pointer hover:bg-white/5 p-1 -m-1 rounded transition-colors ${viewMode !== 'circle' ? 'opacity-50 hover:opacity-100' : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    if (viewMode !== 'circle') setViewMode('circle');
                }}
            >
                <div className={`font-bold mb-0.5 flex items-center gap-1 ${viewMode === 'circle' ? 'text-blue-400' : 'text-gray-400'}`}>
                    {language === 'it' ? "Cerchio Armonico" : "Harmonic Circle"}
                </div>
                <div className="text-[10px] text-gray-500 leading-tight">
                    {language === 'it'
                        ? "Visualizzazione spaziale delle relazioni tra le note e le loro funzioni."
                        : "Spatial visualization of relationships between notes and their functions."}
                </div>
            </div>
            <div className="border-t border-[#333] pt-2">
                <div
                    className={`cursor-pointer hover:bg-white/5 p-1 -m-1 rounded transition-colors ${viewMode !== 'cards' ? 'opacity-50 hover:opacity-100' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (viewMode !== 'cards') setViewMode('cards');
                    }}
                >
                    <div className={`font-bold mb-0.5 flex items-center gap-1 ${viewMode === 'cards' ? 'text-blue-400' : 'text-gray-400'}`}>
                        {language === 'it' ? "Schede di Analisi" : "Analysis Cards"}
                    </div>
                    <div className="text-[10px] text-gray-500 leading-tight">
                        {language === 'it'
                            ? "Dati analitici dettagliati e scomposizione delle componenti dell'accordo."
                            : "Detailed analytical data and breakdown of chord components."}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <button
            type="button"
            className="flex items-center h-10 md:h-11 bg-[#1a1a1a] p-1 border border-[#333] rounded-xl shadow-inner relative group cursor-pointer transition-all duration-300 hover:border-blue-500/50 tooltip-trigger focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
            aria-label={language === 'it' ? "Cambia Modalità Vista" : "Change View Mode"}
            onMouseEnter={(e) => {
                onCancelClose();
                const rect = e.currentTarget.getBoundingClientRect();
                onOpenTooltip('view', {
                    title: language === 'it' ? "MODALITÀ VISTA" : "VIEW MODE",
                    content: null,
                    x: rect.left + (rect.width / 2),
                    y: rect.bottom,
                    containerWidth: rect.width,
                    clientY: e.clientY
                });
            }}
            onMouseLeave={onScheduleClose}
            onClick={() => {
                const nextMode = viewMode === 'circle' ? 'cards' : 'circle';
                setViewMode(nextMode);
                onCancelClose();
            }}
            onTouchStart={(e) => {
                onCancelClose();
                const rect = e.currentTarget.getBoundingClientRect();
                onOpenTooltip('view', {
                    title: language === 'it' ? "MODALITÀ VISTA" : "VIEW MODE",
                    content: null,
                    x: rect.left + (rect.width / 2),
                    y: rect.bottom,
                    containerWidth: rect.width,
                    clientY: (e as unknown as React.TouchEvent).touches[0].clientY
                });
            }}
        >
            <div className="h-full flex items-center px-3 rounded-lg transition-colors">
                {viewMode === 'circle' ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="2" width="9" height="9" rx="2" fill={cardsIconColors.root} />
                        <rect x="13" y="2" width="9" height="9" rx="2" fill={cardsIconColors.quality} />
                        <rect x="2" y="13" width="9" height="9" rx="2" fill={cardsIconColors.stability} />
                        <rect x="13" y="13" width="9" height="9" rx="2" fill={cardsIconColors.func} />
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="9" stroke="#555" strokeWidth="1.5" fill="none" />
                        {circleIconPoints.map((p, i) => (
                            <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={p.color} />
                        ))}
                    </svg>
                )}
            </div>
            {activeTooltip?.type === 'view' && (
                <Tooltip
                    info={{ ...activeTooltip.info, content: getContent() }}
                    forcePosition="bottom"
                    onMouseEnter={onCancelClose}
                    onMouseLeave={onScheduleClose}
                />
            )}
        </button>
    );
};

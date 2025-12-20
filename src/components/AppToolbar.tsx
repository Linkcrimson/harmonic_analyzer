import React, { useState, useMemo } from 'react';
import { useHarmonic } from '../context/HarmonicContext';
import { useLanguage } from '../context/LanguageContext';
import { Header } from './Header'; // Reusing Header for Title/MIDI
import { SettingsModal } from './SettingsModal';
import { Tooltip, TooltipInfo } from './Tooltip';

interface AppToolbarProps {
    viewMode: 'circle' | 'cards';
    setViewMode: (mode: 'circle' | 'cards') => void;
    isSettingsOpen: boolean;
    setIsSettingsOpen: (isOpen: boolean) => void;
}

export const AppToolbar: React.FC<AppToolbarProps> = ({
    viewMode,
    setViewMode,
    isSettingsOpen,
    setIsSettingsOpen
}) => {
    const [enharmonicHoverInfo, setEnharmonicHoverInfo] = useState<TooltipInfo | null>(null);
    const [bassHoverInfo, setBassHoverInfo] = useState<TooltipInfo | null>(null);
    const [viewModeHoverInfo, setViewModeHoverInfo] = useState<TooltipInfo | null>(null);
    const [settingsHoverInfo, setSettingsHoverInfo] = useState<TooltipInfo | null>(null);

    const { activeNotes, analysis, forceBassAsRoot, toggleBassAsRoot, checkEnharmonic, toggleEnharmonic } = useHarmonic();
    const { language } = useLanguage();

    // Timeout refs to manage delay closing
    const enharmonicTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const bassTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const viewModeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const settingsTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Click outside handler to close all tooltips on mobile interactions
    React.useEffect(() => {


        window.addEventListener('scroll', () => {
            // Close tooltips on scroll to prevent stuck floating
            setEnharmonicHoverInfo(null);
            setBassHoverInfo(null);
            setViewModeHoverInfo(null);
            setSettingsHoverInfo(null);
        }, { capture: true });

        return () => window.removeEventListener('scroll', () => { });
    }, []);

    // Helper to clear timeout
    const clearTooltipTimeout = (ref: React.MutableRefObject<ReturnType<typeof setTimeout> | null>) => {
        if (ref.current) {
            clearTimeout(ref.current);
            ref.current = null;
        }
    };

    // Helper to start close timeout
    const startCloseTimeout = (
        ref: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
        setter: React.Dispatch<React.SetStateAction<TooltipInfo | null>>
    ) => {
        if (ref.current) clearTimeout(ref.current);
        ref.current = setTimeout(() => {
            setter(null);
        }, 300); // 300ms delay to allow moving to tooltip
    };


    // --- Dynamic Icon Logic (Restored from AnalysisView) ---
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

    // --- Dynamic Tooltip Content Generation ---
    const getEnharmonicContent = () => (
        <div className="flex flex-col gap-3 text-left">
            <div
                className={`cursor-pointer hover:bg-white/5 p-1 -m-1 rounded transition-colors ${!checkEnharmonic ? 'opacity-50 hover:opacity-100' : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!checkEnharmonic) toggleEnharmonic();
                }}
            >
                <div className={`font-bold mb-0.5 flex items-center gap-1 ${checkEnharmonic ? 'text-blue-400' : 'text-gray-400'}`}>
                    <span className="font-serif text-lg">♮</span> {language === 'it' ? "Ortografia Semplificata" : "Simplified Spelling"}
                </div>
                <div className="text-[10px] text-gray-500 leading-tight">
                    {language === 'it'
                        ? "La priorità è la facilità di lettura, non la correttezza armonica."
                        : "Priority is readability, not harmonic correctness."}
                </div>
            </div>
            <div className="border-t border-[#333] pt-2">
                <div
                    className={`cursor-pointer hover:bg-white/5 p-1 -m-1 rounded transition-colors ${checkEnharmonic ? 'opacity-50 hover:opacity-100' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (checkEnharmonic) toggleEnharmonic();
                    }}
                >
                    <div className={`font-bold mb-0.5 flex items-center gap-1 ${!checkEnharmonic ? 'text-blue-400' : 'text-gray-400'}`}>
                        <span className="font-serif text-lg">𝄫</span> {language === 'it' ? "Rigore Armonico" : "Harmonic Rigor"}
                    </div>
                    <div className="text-[10px] text-gray-500 leading-tight">
                        {language === 'it'
                            ? "Le note sono scritte rispettando la loro funzione teorica."
                            : "Notes are written respecting their theoretical function."}
                    </div>
                </div>
            </div>
        </div>
    );

    const getBassContent = () => (
        <div className="flex flex-col gap-3 text-left">
            <div
                className={`cursor-pointer hover:bg-white/5 p-1 -m-1 rounded transition-colors ${!forceBassAsRoot ? 'opacity-50 hover:opacity-100' : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!forceBassAsRoot) toggleBassAsRoot();
                }}
            >
                <div className={`font-bold mb-0.5 flex items-center gap-1 ${forceBassAsRoot ? 'text-blue-400' : 'text-gray-400'}`}>
                    {language === 'it' ? "Basso come Fondamentale" : "Bass as Root"}
                </div>
                <div className="text-[10px] text-gray-500 leading-tight">
                    {language === 'it'
                        ? "Considera la nota più bassa come la fondamentale dell'accordo, ignorando i rivolti."
                        : "Treats the lowest note as the chord's root, bypassing theoretical inversions."}
                </div>
            </div>
            <div className="border-t border-[#333] pt-2">
                <div
                    className={`cursor-pointer hover:bg-white/5 p-1 -m-1 rounded transition-colors ${forceBassAsRoot ? 'opacity-50 hover:opacity-100' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (forceBassAsRoot) toggleBassAsRoot();
                    }}
                >
                    <div className={`font-bold mb-0.5 flex items-center gap-1 ${!forceBassAsRoot ? 'text-blue-400' : 'text-gray-400'}`}>
                        {language === 'it' ? "Fondamentale Automatica" : "Automatic Root"}
                    </div>
                    <div className="text-[10px] text-gray-500 leading-tight">
                        {language === 'it'
                            ? "Analisi intelligente: il sistema identifica la fondamentale teorica corretta indipendentemente dal rivolto."
                            : "Smart analysis: the system identifies the correct theoretical root regardless of the inversion."}
                    </div>
                </div>
            </div>
        </div>
    );

    const getViewModeContent = () => (
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

    const getSettingsContent = () => (
        <div className="text-[10px] text-gray-500">
            {language === 'it' ? "Preferenze MIDI, Audio e Aspetto" : "MIDI, Audio & Appearance Preferences"}
        </div>
    );

    return (
        <div className="w-full flex flex-col md:flex-row justify-center items-center gap-3 px-2 py-3 border-b border-[#222] bg-[#0a0a0a] relative z-[100]"
            onClick={() => {
                // Global click in toolbar area acts as "close other tooltips" if needed, 
                // but specific buttons handle their own.
            }}
        >
            <div className="w-full md:w-auto md:absolute md:left-4 flex justify-center md:block mb-1 md:mb-0">
                <Header />
            </div>

            {/* Centered Controls Group */}
            <div className="flex items-center gap-3">
                {/* Enharmonic Toggle */}
                <div
                    className="flex items-center h-10 md:h-11 bg-[#1a1a1a] p-1 border border-[#333] rounded-xl shadow-inner relative group cursor-pointer transition-all duration-300 hover:border-blue-500/50"
                    onMouseEnter={(e) => {
                        clearTooltipTimeout(enharmonicTimeoutRef);
                        const rect = e.currentTarget.getBoundingClientRect();
                        setEnharmonicHoverInfo({
                            title: language === 'it' ? "ORTOGRAFIA MUSICALE" : "MUSICAL SPELLING",
                            content: null, // Content generated in render
                            x: rect.left + (rect.width / 2),
                            y: rect.bottom,
                            containerWidth: rect.width,
                            clientY: e.clientY
                        });
                    }}
                    onMouseLeave={() => startCloseTimeout(enharmonicTimeoutRef, setEnharmonicHoverInfo)}
                    onClick={() => {
                        // Toggle logic for the main button
                        toggleEnharmonic();
                        clearTooltipTimeout(enharmonicTimeoutRef);
                    }}
                >
                    {/* Animated Spelling Label - To the LEFT */}
                    <div className="overflow-hidden max-w-0 group-hover:max-w-[70px] transition-all duration-500 ease-in-out">
                        <span className="text-[9px] uppercase font-bold text-blue-500/70 ml-2 mr-1 select-none tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity duration-300">Spelling</span>
                    </div>

                    <div className="flex items-center h-full">
                        <div className={`w-8 md:w-10 h-full flex items-center justify-center rounded-lg transition-all ${checkEnharmonic
                            ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                            : 'text-gray-600 hover:text-gray-400'}`}>
                            <span className="text-xl font-serif select-none leading-none">♮</span>
                        </div>
                        <div className={`w-8 md:w-10 h-full flex items-center justify-center rounded-lg transition-all ${!checkEnharmonic
                            ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                            : 'text-gray-600 hover:text-gray-400'}`}>
                            <span className="text-xl font-serif select-none leading-none">𝄫</span>
                        </div>
                    </div>

                    {enharmonicHoverInfo && (
                        <Tooltip
                            info={{ ...enharmonicHoverInfo, content: getEnharmonicContent() }}
                            forcePosition="bottom"
                            onMouseEnter={() => clearTooltipTimeout(enharmonicTimeoutRef)}
                            onMouseLeave={() => startCloseTimeout(enharmonicTimeoutRef, setEnharmonicHoverInfo)}
                        />
                    )}
                </div>

                {/* Bass as Root Toggle */}
                <div
                    className={`flex items-center h-10 md:h-11 p-1 bg-[#1a1a1a] border border-[#333] rounded-xl relative group cursor-pointer transition-all duration-300 hover:border-blue-500/50 ${forceBassAsRoot ? 'shadow-[0_0_15px_rgba(59,130,246,0.2)]' : ''}`}
                    onMouseEnter={(e) => {
                        clearTooltipTimeout(bassTimeoutRef);
                        const rect = e.currentTarget.getBoundingClientRect();
                        setBassHoverInfo({
                            title: language === 'it' ? "RIFERIMENTO FONDAMENTALE" : "ROOT REFERENCE",
                            content: null, // Content generated in render
                            x: rect.left + (rect.width / 2),
                            y: rect.bottom,
                            containerWidth: rect.width,
                            clientY: e.clientY
                        });
                    }}
                    onMouseLeave={() => startCloseTimeout(bassTimeoutRef, setBassHoverInfo)}
                    onClick={() => {
                        toggleBassAsRoot();
                        clearTooltipTimeout(bassTimeoutRef);
                    }}
                >
                    {/* Animated Root Label - To the LEFT */}
                    <div className="overflow-hidden max-w-0 group-hover:max-w-[100px] transition-all duration-500 ease-in-out">
                        <span className="text-[9px] uppercase font-bold text-blue-500/70 ml-2 mr-1 select-none tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {language === 'it' ? "Fondamentale" : "Root"}
                        </span>
                    </div>

                    <div className={`w-8 md:w-10 h-full flex items-center justify-center rounded-lg transition-all ${forceBassAsRoot ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle
                                cx="12" cy="8" r={forceBassAsRoot ? "4" : "5.5"}
                                fill={forceBassAsRoot ? "none" : "currentColor"}
                                stroke={forceBassAsRoot ? "currentColor" : "none"}
                                strokeWidth={forceBassAsRoot ? "2" : "0"}
                                className="transition-all duration-500 ease-out"
                            />
                            <rect
                                x="4" y={forceBassAsRoot ? "15" : "16"}
                                width="16" height={forceBassAsRoot ? "6" : "4"}
                                rx="2"
                                fill={forceBassAsRoot ? "currentColor" : "none"}
                                stroke={forceBassAsRoot ? "none" : "currentColor"}
                                strokeWidth={forceBassAsRoot ? "0" : "2"}
                                className="transition-all duration-500 ease-out"
                            />
                            <line
                                x1="12" y1="12" x2="12" y2="16"
                                stroke="currentColor"
                                strokeWidth="1"
                                strokeDasharray="2 2"
                                className={`transition-opacity duration-300 ${forceBassAsRoot ? 'opacity-0' : 'opacity-40'}`}
                            />
                        </svg>
                    </div>

                    {bassHoverInfo && (
                        <Tooltip
                            info={{ ...bassHoverInfo, content: getBassContent() }}
                            forcePosition="bottom"
                            onMouseEnter={() => clearTooltipTimeout(bassTimeoutRef)}
                            onMouseLeave={() => startCloseTimeout(bassTimeoutRef, setBassHoverInfo)}
                        />
                    )}
                </div>

                {/* View Mode Toggle */}
                <div
                    className="flex items-center h-10 md:h-11 bg-[#1a1a1a] p-1 border border-[#333] rounded-xl shadow-inner relative group cursor-pointer transition-all duration-300 hover:border-blue-500/50"
                    onMouseEnter={(e) => {
                        clearTooltipTimeout(viewModeTimeoutRef);
                        const rect = e.currentTarget.getBoundingClientRect();
                        setViewModeHoverInfo({
                            title: language === 'it' ? "MODALITÀ VISTA" : "VIEW MODE",
                            content: null, // Content generated in render
                            x: rect.left + (rect.width / 2),
                            y: rect.bottom,
                            containerWidth: rect.width,
                            clientY: e.clientY
                        });
                    }}
                    onMouseLeave={() => startCloseTimeout(viewModeTimeoutRef, setViewModeHoverInfo)}
                    onClick={() => {
                        const nextMode = viewMode === 'circle' ? 'cards' : 'circle';
                        setViewMode(nextMode);
                        clearTooltipTimeout(viewModeTimeoutRef);
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
                    {viewModeHoverInfo && (
                        <Tooltip
                            info={{ ...viewModeHoverInfo, content: getViewModeContent() }}
                            forcePosition="bottom"
                            onMouseEnter={() => clearTooltipTimeout(viewModeTimeoutRef)}
                            onMouseLeave={() => startCloseTimeout(viewModeTimeoutRef, setViewModeHoverInfo)}
                        />
                    )}
                </div>

                {/* Settings Toggle */}
                <div
                    className="relative"
                    onMouseEnter={(e) => {
                        clearTooltipTimeout(settingsTimeoutRef);
                        const rect = e.currentTarget.getBoundingClientRect();
                        setSettingsHoverInfo({
                            title: language === 'it' ? "IMPOSTAZIONI" : "SETTINGS",
                            content: null, // Content generated in render
                            x: rect.left + (rect.width / 2),
                            y: rect.bottom,
                            containerWidth: rect.width,
                            clientY: e.clientY
                        });
                    }}
                    onMouseLeave={() => startCloseTimeout(settingsTimeoutRef, setSettingsHoverInfo)}
                    onClick={() => {
                        setIsSettingsOpen(true);
                        setSettingsHoverInfo(null); // Close tooltip when opening settings
                    }}
                >
                    <div className="h-10 md:h-11 w-10 md:w-11 flex items-center justify-center rounded-xl bg-[#1a1a1a] border border-[#333] hover:bg-[#252525] hover:border-blue-500/50 text-gray-400 hover:text-white transition-all cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    {settingsHoverInfo && (
                        <Tooltip
                            info={{ ...settingsHoverInfo, content: getSettingsContent() }}
                            forcePosition="bottom"
                            onMouseEnter={() => clearTooltipTimeout(settingsTimeoutRef)}
                            onMouseLeave={() => startCloseTimeout(settingsTimeoutRef, setSettingsHoverInfo)}
                        />
                    )}
                </div>

                <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            </div>
        </div>
    );
};

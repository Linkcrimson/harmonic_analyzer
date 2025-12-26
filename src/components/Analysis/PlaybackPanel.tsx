import React from 'react';
import { useHarmonic } from '../../context/HarmonicContext';
import { useLanguage } from '../../context/LanguageContext';
import { Reorder } from 'framer-motion';
import { Tooltip } from '../Tooltip';

const BPMIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
    </svg>
);

const ChevronIcon = ({ className }: { className?: string }) => (
    <svg
        width="40"
        height="12"
        viewBox="0 0 24 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <polyline points="2 2 12 12 22 2" />
    </svg>
);

// New Icons for Arp Patterns
const IconUp = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 20 9 20 9 14 15 14 15 8 20 8 20 4" /></svg>;
const IconDown = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 4 9 4 9 10 15 10 15 16 20 16 20 20" /></svg>;
const IconUpDown = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 20 12 4 20 20" /></svg>;
const IconRandom = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></svg>;
const IconHarmonic = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /></svg>;
const IconInfo = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>;
const IconPlay = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3" /></svg>;
const IconStop = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>;

const getItemColor = (item: string) => {
    switch (item) {
        case 'root': return 'var(--col-root)';
        case '3rd': return 'var(--col-third)';
        case '5th': return 'var(--col-fifth)';
        case '7th': return 'var(--col-seventh)';
        case '9th':
        case '11th':
        case '13th':
            return 'var(--col-ext)';
        default: return '#888';
    }
};

export const PlaybackPanel: React.FC = () => {
    const {
        audioMode,
        bpm,
        setBpm,
        arpPattern,
        setArpPattern,
        arpSortMode,
        setArpSortMode,
        arpDivision,
        setArpDivision,
        arpOctaves,
        setArpOctaves,
        masterVolume,
        setMasterVolume,
        shortDuration,
        setShortDuration,
        activeNotes,
        arpHarmonicOrder,
        setArpHarmonicOrder,
        arpSplitDoublings,
        setArpSplitDoublings,
        togglePlayback,
        analysis,
        activeArpNote
    } = useHarmonic();

    const { t } = useLanguage();
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [tooltipInfo, setTooltipInfo] = React.useState<any>(null); // For custom tooltip

    // Helper to toggle playback

    const handleTogglePlayback = (e: React.MouseEvent) => {
        e.stopPropagation();
        togglePlayback();
    };

    const patternLabels: Record<string, string> = {
        up: 'Up',
        down: 'Down',
        updown: 'Up/Down',
        random: 'Random'
    };

    const getHarmonicCategory = (intervalName: string): string => {
        if (!intervalName) return 'root';
        if (intervalName === 'root' || intervalName === 'R') return 'root';
        if (['3', 'b3', 'bb3', 'sus2', 'sus4', 'third'].includes(intervalName)) return '3rd';
        if (['5', 'b5', '#5', 'dim5', 'aug5', 'fifth'].includes(intervalName)) return '5th';
        if (['7', 'b7', 'bb7', 'maj7', 'seventh'].includes(intervalName)) return '7th';
        if (['9', 'b9', '#9'].includes(intervalName)) return '9th';
        if (['11', '#11'].includes(intervalName)) return '11th';
        if (['13', 'b13'].includes(intervalName)) return '13th';
        return 'root';
    };

    const isFunctionActive = (category: string) => {
        // If in arpeggio mode, we strictly follow the active playing note.
        // We do not show the static chord state to avoid flickering (single note -> full chord -> single note).
        if (audioMode === 'arpeggio') {
            if (activeArpNote === null) return false;

            // Arp engine might play octaves not in the original activeNotes.
            // We need to match by Pitch Class (primary active note logic).
            const notePC = activeArpNote % 12;
            let matchedInterval = null;

            // Find any active note with the same PC
            for (const [noteId, interval] of analysis.intervals.entries()) {
                if (noteId % 12 === notePC) {
                    matchedInterval = interval;
                    break;
                }
            }

            if (!matchedInterval) return category === 'root'; // Fallback
            return getHarmonicCategory(matchedInterval) === category;
        }

        // Fallback for non-arpeggio modes: check if any active note maps to this category (static view)
        if (activeNotes.size === 0) return false;
        return Array.from(activeNotes).some(note => {
            const interval = analysis.intervals.get(note) || analysis.intervals.get(note % 12);
            if (!interval) return category === 'root'; // Fallback
            return getHarmonicCategory(interval) === category;
        });
    };

    const ArpControlsContent = (
        <div className="flex flex-col gap-3 w-full">
            {/* Row 1: Sort Mode & Patterns & Octaves */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Sort Mode */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-center gap-1 group/info">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider pl-1 font-mono text-center">Sort</div>
                        <button
                            className="text-gray-600 hover:text-cyan-400"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setTooltipInfo({
                                    title: t('tooltips.sortModeTitle'),
                                    content: t('tooltips.sortModeContent'),
                                    x: rect.left + rect.width / 2,
                                    y: rect.top,
                                    containerWidth: window.innerWidth,
                                    clientY: e.clientY
                                });
                            }}
                        >
                            <IconInfo />
                        </button>
                    </div>
                    <div className="flex bg-[#161616] rounded-lg p-1 border border-[#333]">
                        <button
                            onClick={() => setArpSortMode('pitch')}
                            className={`w-8 flex items-center justify-center p-2 rounded text-xs font-bold font-mono transition-all ${arpSortMode === 'pitch'
                                ? 'bg-cyan-900/50 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-[#222]'
                                }`}
                            title="Pitch Order"
                        >
                            P
                        </button>
                        <button
                            onClick={() => setArpSortMode('harmonic')}
                            className={`w-8 flex items-center justify-center p-2 rounded text-xs font-bold font-mono transition-all ${arpSortMode === 'harmonic'
                                ? 'bg-cyan-900/50 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-[#222]'
                                }`}
                            title="Harmonic Order"
                        >
                            <IconHarmonic />
                        </button>
                    </div>
                </div>

                {/* Patterns */}
                <div className="flex-1 flex flex-col gap-1">
                    <div className="px-1 flex items-center justify-center gap-2">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Pattern</span>
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">{patternLabels[arpPattern]}</span>
                    </div>
                    <div className="flex bg-[#161616] rounded-lg p-1 border border-[#333]">
                        {[
                            { id: 'up', icon: <IconUp />, title: 'Up' },
                            { id: 'down', icon: <IconDown />, title: 'Down' },
                            { id: 'updown', icon: <IconUpDown />, title: 'Up/Down' },
                            { id: 'random', icon: <IconRandom />, title: 'Random' }
                        ].map((pat) => (
                            <button
                                key={pat.id}
                                onClick={() => setArpPattern(pat.id as any)}
                                className={`flex-1 flex items-center justify-center p-2 rounded transition-all ${arpPattern === pat.id
                                    ? 'bg-cyan-900/50 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-[#222]'
                                    }`}
                                title={pat.title}
                            >
                                {pat.icon}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Octaves */}
                <div className="flex flex-col gap-1">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider pl-1 font-mono text-center">OCT</div>
                    <div className="flex bg-[#161616] rounded-lg p-1 border border-[#333]">
                        {[1, 2, 3].map((oct) => (
                            <button
                                key={oct}
                                onClick={() => setArpOctaves(oct)}
                                className={`w-8 flex items-center justify-center p-2 rounded text-xs font-bold font-mono transition-all ${arpOctaves === oct
                                    ? 'bg-cyan-900/50 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-[#222]'
                                    }`}
                            >
                                {oct}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Row 1.5: Harmonic Reorder (Visible only if Sort is Harmonic) */}
            {arpSortMode === 'harmonic' && (
                <div className="flex flex-col gap-2 border-t border-[#222] pt-2 mt-1">
                    <div className="flex items-center justify-between px-1">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Harmonic Order</div>
                        <div className="flex items-center gap-2">
                            <button
                                className="text-gray-600 hover:text-cyan-400 p-1"
                                onClick={() => setArpHarmonicOrder(['root', '9th', '3rd', '11th', '5th', '13th', '7th'])}
                                title={t('tooltips.resetOrder') || "Reset Order"}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                    <path d="M3 3v5h5" />
                                </svg>
                            </button>
                            <button
                                className="text-gray-600 hover:text-cyan-400 p-1"
                                onClick={() => {
                                    const shuffled = [...arpHarmonicOrder].sort(() => Math.random() - 0.5);
                                    setArpHarmonicOrder(shuffled);
                                }}
                                title={t('tooltips.randomizeOrder') || "Randomize Order"}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="16 3 21 3 21 8" />
                                    <line x1="4" y1="20" x2="21" y2="3" />
                                    <polyline points="21 16 21 21 16 21" />
                                    <line x1="15" y1="15" x2="21" y2="21" />
                                    <line x1="4" y1="4" x2="9" y2="9" />
                                </svg>
                            </button>
                            {/* Split Doublings Toggle */}
                            <div className="flex items-center gap-1">
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{t('tooltips.splitDoublings') || 'Dividi Raddoppi'}</span>
                                    <button
                                        className="text-gray-600 hover:text-cyan-400"
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setTooltipInfo({
                                                title: t('tooltips.splitDoublings'),
                                                content: t('tooltips.splitDoublingsContent'),
                                                x: rect.left + rect.width / 2,
                                                y: rect.top,
                                                containerWidth: window.innerWidth,
                                                clientY: e.clientY
                                            });
                                        }}
                                    >
                                        <IconInfo />
                                    </button>
                                </div>
                                <button
                                    onClick={() => setArpSplitDoublings(!arpSplitDoublings)}
                                    className={`w-8 h-4 rounded-full relative transition-colors ${arpSplitDoublings ? 'bg-cyan-900/50 border border-cyan-500/50' : 'bg-[#222] border border-[#333]'}`}
                                >
                                    <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-current transition-all ${arpSplitDoublings ? 'left-4 text-cyan-400' : 'left-0.5 text-gray-500'}`}></div>
                                </button>
                            </div>
                        </div>
                    </div>

                    <Reorder.Group axis="x" values={arpHarmonicOrder} onReorder={setArpHarmonicOrder} className="flex flex-row flex-wrap gap-2 mt-2 justify-center">
                        {arpHarmonicOrder.map((item) => {
                            const isActive = isFunctionActive(item);
                            const color = getItemColor(item);
                            return (
                                <Reorder.Item
                                    key={item}
                                    value={item}
                                    layout
                                    className="w-10 h-10 bg-[#161616] border border-[#333] rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing shadow-sm hover:border-gray-500 transition-colors"
                                    style={{
                                        borderColor: isActive ? color : `color-mix(in srgb, ${color} 30%, transparent)`, // Softer border when inactive
                                        color: isActive ? '#000' : color,
                                        // Base fill (neutral) -> Accentuated fill
                                        backgroundColor: isActive ? color : `color-mix(in srgb, ${color} 10%, transparent)`,
                                        // Removed strong neon glow, kept subtle drop shadow for depth
                                        boxShadow: isActive ? `0 4px 12px -2px ${color}` : 'none',
                                        transform: isActive ? 'scale(1.05)' : 'scale(1)' // Gentler pulse
                                    }}
                                    whileDrag={{ scale: 1.15, zIndex: 50, cursor: 'grabbing' }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                >
                                    <span className="font-mono font-bold text-[10px] uppercase pointer-events-none select-none">
                                        {item === 'root' ? 'R' : item.replace('th', '').replace('rd', '').replace('nd', '')}
                                    </span>
                                </Reorder.Item>
                            );
                        })}
                    </Reorder.Group>
                </div>
            )}
            {/* Row 2: Divisions */}
            <div className="flex flex-col gap-1">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider pl-1">Grid</div>
                <div className="flex bg-[#161616] rounded-lg p-1 border border-[#333]">
                    {[
                        { val: 1 / 4, label: '1/4' },
                        { val: 1 / 8, label: '1/8' },
                        { val: 1 / 16, label: '1/16' }
                    ].map((div) => (
                        <button
                            key={div.label}
                            onClick={() => setArpDivision(div.val)}
                            className={`flex-1 flex items-center justify-center p-2 rounded text-xs font-mono font-bold transition-all ${arpDivision === div.val
                                ? 'bg-cyan-900/50 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-[#222]'
                                }`}
                        >
                            {div.label}
                        </button>
                    ))}
                </div>
                {/* Row 3: Harmonic Reorder (Visible only if Sort is Harmonic and Expanded) */}


            </div>
        </div>
    );

    return (
        <>
            <div className="w-full relative z-40 flex flex-col-reverse md:flex-col items-center animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-top-2 duration-300 group">

                {/* Collapsible Drawer - Contains ALL settings */}
                <div
                    className={`
                    w-full overflow-hidden transition-all duration-300 ease-in-out bg-[#111] md:bg-transparent
                    ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
                `}
                >
                    <div className="bg-[#111] border-t md:border border-[#333] md:border-b-0 md:rounded-t-xl px-4 lg:px-6 py-4 flex flex-col gap-4 shadow-xl pb-2 md:pb-4">

                        {/* Title: Mode Name & Play/Stop */}
                        <div className="flex items-center justify-between border-b border-[#222] pb-2 mb-1">
                            <div className="flex-1"></div> {/* Spacer */}
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] text-center">
                                {t(`audio_modes.${audioMode}`) || audioMode}
                            </div>
                            <div className="flex-1 flex justify-end">
                                <button
                                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${activeNotes.size > 0
                                        ? 'bg-cyan-900/50 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                                        : 'text-gray-500 hover:text-gray-300 hover:bg-[#222]'
                                        }`}
                                    onClick={handleTogglePlayback}
                                    id="playback-toggle-btn"
                                >
                                    {activeNotes.size > 0 ? <IconStop /> : <IconPlay />}
                                </button>
                            </div>
                        </div>

                        {/* Controls Stack */}
                        <div className="flex flex-col gap-3">

                            {/* Master Volume */}
                            <div className="flex items-center gap-4 group/vol">
                                <div className="w-16 lg:w-20 text-[10px] font-bold text-gray-400 group-hover/vol:text-cyan-400 transition-colors tracking-wider uppercase flex items-center gap-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                                    </svg>
                                    Vol
                                </div>
                                <div className="flex-1 flex flex-col justify-center h-full pt-1">
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={masterVolume}
                                        onChange={(e) => setMasterVolume(Number(e.target.value))}
                                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
                                    />
                                </div>
                                <div className="w-10 text-right text-[10px] font-mono text-gray-500">
                                    {Math.round(masterVolume * 100)}%
                                </div>
                            </div>

                            {/* BPM - Visible for Repeat and Arpeggio */}
                            {(audioMode === 'repeat' || audioMode === 'arpeggio') && (
                                <div className="flex items-center gap-4 group/bpm">
                                    <div className="w-16 lg:w-20 text-[10px] font-bold text-gray-400 group-hover/bpm:text-cyan-400 transition-colors tracking-wider uppercase flex items-center gap-2">
                                        <BPMIcon />
                                        BPM
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center h-full pt-1">
                                        <input
                                            type="range"
                                            min="40"
                                            max="240"
                                            value={bpm}
                                            onChange={(e) => setBpm(Number(e.target.value))}
                                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
                                        />
                                    </div>
                                    <div className="w-10 text-right text-[10px] font-mono text-gray-500">
                                        {bpm}
                                    </div>
                                </div>
                            )}

                            {/* Duration - Visible for Short Mode */}
                            {audioMode === 'short' && (
                                <div className="flex items-center gap-4 group/dur">
                                    <div className="w-16 lg:w-20 text-[10px] font-bold text-gray-400 group-hover/dur:text-cyan-400 transition-colors tracking-wider uppercase flex items-center gap-2">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                        Time
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center h-full pt-1">
                                        <input
                                            type="range"
                                            min="0.05"
                                            max="1.0"
                                            step="0.05"
                                            value={shortDuration}
                                            onChange={(e) => setShortDuration(Number(e.target.value))}
                                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
                                        />
                                    </div>
                                    <div className="w-10 text-right text-[10px] font-mono text-gray-500">
                                        {shortDuration.toFixed(1)}s
                                    </div>
                                </div>
                            )}

                            {/* Arpeggio Selectors Row */}
                            {audioMode === 'arpeggio' && (
                                <div className="pt-2 border-t border-[#222] mt-1">
                                    {ArpControlsContent}
                                    {/* DEBUG */}
                                    {/* <div className="text-[10px] bg-black text-green-500 font-mono p-2 mt-2 w-full overflow-auto">
                                        DEBUG: {activeArpNote} | {arpSortMode} <br/>
                                        Intervals: {JSON.stringify(Array.from(analysis.intervals.entries()))}
                                    </div> */}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Handle / Trigger (Always Visible) */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`
                    w-full h-6 md:h-5 flex items-center justify-center 
                    bg-[#111] hover:bg-[#1a1a1a] transition-colors
                    text-gray-600 hover:text-cyan-400 border border-[#333]
                    shadow-md
                    rounded-t-xl md:rounded-t-none md:rounded-b-xl 
                    border-b-0 md:border-b md:border-t-0
                    ${isExpanded ? 'md:border-t-0' : 'md:border-t'}
                `}
                    title={isExpanded ? "Chiudi" : "Impostazioni Audio"}
                >
                    <ChevronIcon className={`transition-transform duration-300 ${isExpanded ? 'rotate-0 md:rotate-180' : 'rotate-180 md:rotate-0'}`} />
                </button>
            </div>
            {tooltipInfo && (
                <Tooltip
                    info={tooltipInfo}
                    onMouseLeave={() => setTooltipInfo(null)}
                />
            )}
        </>
    );
};


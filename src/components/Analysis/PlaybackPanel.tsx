import React from 'react';
import { useHarmonic } from '../../context/HarmonicContext';
import { useLanguage } from '../../context/LanguageContext';

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
        setShortDuration
    } = useHarmonic();
    const { t } = useLanguage();
    const [isExpanded, setIsExpanded] = React.useState(false);

    const patternLabels: Record<string, string> = {
        up: 'Up',
        down: 'Down',
        updown: 'Up/Down',
        random: 'Random'
    };

    const ArpControls = () => (
        <div className="flex flex-col gap-3 w-full">
            {/* Row 1: Sort Mode & Patterns & Octaves */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Sort Mode */}
                <div className="flex flex-col gap-1">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider pl-1 font-mono text-center">Sort</div>
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
            </div>
        </div>
    );

    return (
        <div className="w-full relative z-40 flex flex-col-reverse md:flex-col items-center animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-top-2 duration-300 group">

            {/* Collapsible Drawer - Contains ALL settings */}
            <div
                className={`
                    w-full overflow-hidden transition-all duration-300 ease-in-out bg-[#111] md:bg-transparent
                    ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
                `}
            >
                <div className="bg-[#111] border-t md:border border-[#333] md:border-b-0 md:rounded-t-xl px-4 lg:px-6 py-4 flex flex-col gap-4 shadow-xl pb-2 md:pb-4">

                    {/* Title: Mode Name */}
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] text-center border-b border-[#222] pb-2 mb-1">
                        {t(`audio_modes.${audioMode}`) || audioMode}
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
                                <ArpControls />
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
    );
};

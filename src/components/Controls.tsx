import React, { useRef, useState, useEffect } from 'react';
import { useHarmonic, AudioMode } from '../context/HarmonicContext';
import { OscillatorType } from '../hooks/useAudio';
import { KeyboardMinimap } from './Piano/KeyboardMinimap';

const waveforms: { value: OscillatorType; label: string }[] = [
    { value: 'sine', label: 'Sinusoide' },
    { value: 'triangle', label: 'Triangolare' },
    { value: 'square', label: 'Quadra' },
    { value: 'sawtooth', label: 'Dente di Sega' }
];

const audioModes: { value: AudioMode; label: string }[] = [
    { value: 'short', label: 'Breve' },
    { value: 'repeat', label: 'Ripeti' },
    { value: 'continuous', label: 'Continuo' }
];

const WaveformIcon: React.FC<{ type: OscillatorType }> = ({ type }) => {
    switch (type) {
        case 'sine': return <path d="M2 12s4-8 10-8 10 8 10 8" />;
        case 'triangle': return <path d="M2 19l10-14 10 14" />;
        case 'square': return <path d="M3 12h6v-8h6v16h6" />;
        case 'sawtooth': return <path d="M4 18L20 6v12" />;
        default: return null;
    }
};

const AudioModeIcon: React.FC<{ mode: AudioMode }> = ({ mode }) => {
    switch (mode) {
        case 'short': return <circle cx="12" cy="12" r="4" fill="currentColor" />;
        case 'repeat': return (
            <>
                <path d="M4 12h3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <path d="M10.5 12h3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <path d="M17 12h3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </>
        );
        case 'continuous': return <path d="M4 12h16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />;
        default: return null;
    }
};

interface SelectorProps<T> {
    options: { value: T; label: string; icon: React.ReactNode }[];
    selectedValue: T;
    onChange: (value: T) => void;
    title: string;
}

function Selector<T extends string>({ options, selectedValue, onChange, title }: SelectorProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);

    const currentOption = options.find(o => o.value === selectedValue) || options[0];

    return (
        <div ref={containerRef} className="relative z-50">
            {/* Trigger Button (Visible when closed) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`h-10 w-10 rounded-full bg-[#161616] border border-[#333] flex items-center justify-center transition-all focus:outline-none shadow-sm relative z-10 ${isOpen ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-white hover:border-gray-500'
                    }`}
                title={title}
            >
                {currentOption.icon}
            </button>

            {/* Expanded List (Visible when open) */}
            {isOpen && (
                <div className="absolute left-0 w-10 bg-[#161616] border border-[#333] rounded-full flex flex-col-reverse lg:flex-col items-center py-1 gap-1 shadow-lg animate-in fade-in zoom-in-95 duration-200 bottom-0 lg:bottom-auto lg:top-0">
                    {/* The "pill" container expands UP on mobile (bottom-0) and DOWN on desktop (top-0) */}
                    {options.map((option) => {
                        const isSelected = option.value === selectedValue;
                        return (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${isSelected
                                    ? 'bg-black text-white shadow-inner' // Active: Black bubble (or distinct color if preferred, user said 'bolla nera')
                                    // Wait, user said: "colorato il simbolo corrente nella bolla nera, gli altri sono ... simbolo grigio/bianco e sfondo nero"
                                    // "Sfondo nero" is the main list bg. 
                                    // So Active = Black Bubble + Colored Icon? Or just Icon Color?
                                    // "colorato il simbolo corrente nella bolla nera" -> Symbol is colored. Bubble is black.
                                    // "gli altri ... simbolo grigio/bianco e sfondo nero"
                                    // The whole list track is black (#161616).
                                    // Let's make the Active item use the active theme color for the ICON.
                                    : 'text-gray-500 hover:text-gray-300'
                                    }`}
                                title={option.label}
                            >
                                <div className={`${isSelected ? 'text-cyan-400' : ''} transform scale-75`}>
                                    {option.icon}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

interface ControlsProps {
    scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export const Controls: React.FC<ControlsProps> = ({ scrollContainerRef }) => {
    const { currentWaveform, setWaveform, reset, audioMode, setAudioMode } = useHarmonic();




    return (
        <div
            className="flex justify-between items-center w-full max-w-[600px] mb-2 lg:mb-4 relative z-10 overflow-visible rounded-lg p-1 transition-colors duration-300"
            style={{
                background: 'transparent',
            }}
        >



            {/* Desktop: show text label */}
            <div className="hidden lg:flex text-xs text-gray-500 font-bold uppercase tracking-widest items-center gap-2 pointer-events-none">
                <span>TASTIERA INTERATTIVA</span>
            </div>

            {/* Mobile: show minimap */}
            <div className="lg:hidden flex-1 mr-3" onTouchStart={(e) => e.stopPropagation()}>
                {scrollContainerRef && <KeyboardMinimap scrollContainerRef={scrollContainerRef} />}
            </div>

            <div className="flex gap-2 lg:gap-3 relative z-50" onTouchStart={(e) => e.stopPropagation()}>
                {/* Waveform Selector */}
                <Selector
                    title="Forma d'Onda"
                    selectedValue={currentWaveform}
                    onChange={setWaveform}
                    options={waveforms.map(w => ({
                        ...w,
                        icon: (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <WaveformIcon type={w.value} />
                            </svg>
                        )
                    }))}
                />

                {/* Audio Mode Selector */}
                <Selector
                    title="Modalità Audio"
                    selectedValue={audioMode}
                    onChange={setAudioMode}
                    options={audioModes.map(m => ({
                        ...m,
                        icon: (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <AudioModeIcon mode={m.value} />
                            </svg>
                        )
                    }))}
                />


                {/* Reset Button */}
                <button onClick={reset}
                    className="h-10 w-10 rounded-full bg-[#222] text-gray-400 hover:bg-[#333] border border-[#333] flex items-center justify-center shadow-sm transition active:scale-95 relative z-10"
                    title="Resetta">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd"
                            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v3.276a1 1 0 01-2 0V14.907a7.002 7.002 0 01-11.669-3.676 1 1 0 01.676-1.174z"
                            clipRule="evenodd" />
                    </svg>
                </button>

            </div>
        </div>
    );
};

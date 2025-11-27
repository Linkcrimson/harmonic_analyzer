import React from 'react';
import { useHarmonic } from '../context/HarmonicContext';
import { OscillatorType } from '../hooks/useAudio';

const waveforms: OscillatorType[] = ['sine', 'triangle', 'square', 'sawtooth'];

const WaveformIcon: React.FC<{ type: OscillatorType }> = ({ type }) => {
    switch (type) {
        case 'sine': return <path d="M2 12s4-8 10-8 10 8 10 8" />;
        case 'triangle': return <path d="M2 19l10-14 10 14" />;
        case 'square': return <path d="M3 12h6v-8h6v16h6" />;
        case 'sawtooth': return <path d="M4 18L20 6v12" />;
        default: return null;
    }
};

export const Controls: React.FC = () => {
    const { currentWaveform, setWaveform, playCurrentChord, reset } = useHarmonic();

    const toggleWaveform = () => {
        const currentIndex = waveforms.indexOf(currentWaveform);
        const nextIndex = (currentIndex + 1) % waveforms.length;
        setWaveform(waveforms[nextIndex]);
    };

    return (
        <div className="flex justify-between items-center w-full max-w-[600px] mb-2 lg:mb-4 relative z-10">
            <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                Tastiera Interattiva
            </div>
            <div className="flex gap-2 lg:gap-3">
                {/* Waveform Toggle */}
                <button onClick={toggleWaveform}
                    className="h-10 w-10 rounded-full bg-[#161616] text-gray-400 hover:text-white border border-[#333] hover:border-gray-500 flex items-center justify-center transition-colors focus:outline-none shadow-sm"
                    title="Cambia Forma d'Onda">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <WaveformIcon type={currentWaveform} />
                    </svg>
                </button>

                {/* Play Button */}
                <button onClick={playCurrentChord}
                    className="h-10 w-10 rounded-full bg-[#222] text-white hover:bg-[#333] border border-[#333] flex items-center justify-center shadow-sm transition active:scale-95"
                    title="Suona Accordo">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                            clipRule="evenodd" />
                    </svg>
                </button>

                {/* Reset Button */}
                <button onClick={reset}
                    className="h-10 w-10 rounded-full bg-[#222] text-gray-400 hover:bg-[#333] border border-[#333] flex items-center justify-center shadow-sm transition active:scale-95"
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

import React from 'react';
import { useHarmonic, InputMode } from '../../context/HarmonicContext';

export const InputSettings: React.FC = () => {
    const { inputMode, setInputMode } = useHarmonic();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Modalità Input Tastiera</label>
                <div className="grid grid-cols-1 gap-3">
                    {[
                        { id: 'toggle', label: 'Toggle (Standard)', desc: 'Clicca per attivare/disattivare le note.' },
                        { id: 'momentary', label: 'Pianoforte (Momentary)', desc: 'Suona solo mentre tieni premuto.' },
                        { id: 'smart', label: 'Smart Sustain', desc: 'Tocco veloce = Toggle. Pressione lunga = Momentary.' },
                    ].map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => setInputMode(mode.id as InputMode)}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left ${inputMode === mode.id
                                ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                : 'bg-[#222] border-[#333] hover:border-gray-500'
                                }`}
                        >
                            <div>
                                <div className="font-medium text-white">{mode.label}</div>
                                <div className="text-xs text-gray-400 mt-1">{mode.desc}</div>
                            </div>
                            {inputMode === mode.id && (
                                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

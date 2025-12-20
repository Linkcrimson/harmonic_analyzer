import React from 'react';
import { useNotation } from '../../context/NotationContext';

export const NotationSettings: React.FC = () => {
    const { settings: notationSettings, updateSettings: updateNotationSettings } = useNotation();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-400 mb-1">Stile Simboli Accordi</label>
                <p className="text-xs text-gray-500 mb-4">Personalizza come vengono visualizzati i simboli degli accordi.</p>

                {/* Major */}
                <div className="space-y-2">
                    <label className="text-xs text-gray-400">Maggiore (Major)</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { val: '∆', label: '∆' },
                            { val: 'maj', label: 'maj' }
                        ].map((opt) => (
                            <button
                                key={opt.val}
                                onClick={() => updateNotationSettings({ major: opt.val as any })}
                                className={`p-3 rounded-xl border text-sm font-medium transition-all ${notationSettings.major === opt.val
                                    ? 'bg-blue-900/20 border-blue-500 text-white'
                                    : 'bg-[#222] border-[#333] text-gray-400 hover:border-gray-500'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Minor */}
                <div className="space-y-2">
                    <label className="text-xs text-gray-400">Minore (Minor)</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { val: '-', label: '-' },
                            { val: 'min', label: 'min' },
                            { val: 'm', label: 'm' }
                        ].map((opt) => (
                            <button
                                key={opt.val}
                                onClick={() => updateNotationSettings({ minor: opt.val as any })}
                                className={`p-3 rounded-xl border text-sm font-medium transition-all ${notationSettings.minor === opt.val
                                    ? 'bg-blue-900/20 border-blue-500 text-white'
                                    : 'bg-[#222] border-[#333] text-gray-400 hover:border-gray-500'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Diminished */}
                <div className="space-y-2">
                    <label className="text-xs text-gray-400">Diminuito (Diminished)</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { val: '°', label: '°' },
                            { val: 'dim', label: 'dim' },
                            { val: 'dynamic', label: `${notationSettings.minor}${notationSettings.accidental}5` }
                        ].map((opt) => (
                            <button
                                key={opt.val}
                                onClick={() => updateNotationSettings({ diminished: opt.val as any })}
                                className={`p-3 rounded-xl border text-sm font-medium transition-all ${notationSettings.diminished === opt.val
                                    ? 'bg-blue-900/20 border-blue-500 text-white'
                                    : 'bg-[#222] border-[#333] text-gray-400 hover:border-gray-500'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Augmented */}
                <div className="space-y-2">
                    <label className="text-xs text-gray-400">Aumentato (Augmented)</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { val: '+', label: '+' },
                            { val: 'aug', label: 'aug' }
                        ].map((opt) => (
                            <button
                                key={opt.val}
                                onClick={() => updateNotationSettings({ augmented: opt.val as any })}
                                className={`p-3 rounded-xl border text-sm font-medium transition-all ${notationSettings.augmented === opt.val
                                    ? 'bg-blue-900/20 border-blue-500 text-white'
                                    : 'bg-[#222] border-[#333] text-gray-400 hover:border-gray-500'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Half-Diminished */}
                <div className="space-y-2">
                    <label className="text-xs text-gray-400">Semidiminuito (Half-Diminished)</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { val: 'ø', label: 'ø' },
                            { val: 'dynamic', label: `${notationSettings.minor}7${notationSettings.accidental}5` }
                        ].map((opt) => (
                            <button
                                key={opt.val}
                                onClick={() => updateNotationSettings({ halfDiminished: opt.val as any })}
                                className={`p-3 rounded-xl border text-sm font-medium transition-all ${notationSettings.halfDiminished === opt.val
                                    ? 'bg-blue-900/20 border-blue-500 text-white'
                                    : 'bg-[#222] border-[#333] text-gray-400 hover:border-gray-500'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Accidentals */}
                <div className="space-y-2">
                    <label className="text-xs text-gray-400">Alterazioni (Accidentals)</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { val: '♭', label: '♭ / ♯' },
                            { val: 'b', label: 'b / #' }
                        ].map((opt) => (
                            <button
                                key={opt.val}
                                onClick={() => updateNotationSettings({ accidental: opt.val as any })}
                                className={`p-3 rounded-xl border text-sm font-medium transition-all ${notationSettings.accidental === opt.val
                                    ? 'bg-blue-900/20 border-blue-500 text-white'
                                    : 'bg-[#222] border-[#333] text-gray-400 hover:border-gray-500'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Omit */}
                <div className="space-y-2">
                    <label className="text-xs text-gray-400">Omissioni (Omit/No)</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { val: 'omit', label: 'omit (Comit3)' },
                            { val: 'no', label: 'no (Cno3)' }
                        ].map((opt) => (
                            <button
                                key={opt.val}
                                onClick={() => updateNotationSettings({ omit: opt.val as any })}
                                className={`p-3 rounded-xl border text-sm font-medium transition-all ${notationSettings.omit === opt.val
                                    ? 'bg-blue-900/20 border-blue-500 text-white'
                                    : 'bg-[#222] border-[#333] text-gray-400 hover:border-gray-500'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

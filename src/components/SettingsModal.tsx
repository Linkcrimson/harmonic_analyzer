import React from 'react';
import ReactDOM from 'react-dom';
import { useTheme } from '../context/ThemeContext';
import { useHarmonic, InputMode } from '../context/HarmonicContext';
import { usePWA } from '../context/PWAContext';
import { useNotation } from '../context/NotationContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { theme, setTheme, customColors, setCustomColors } = useTheme();
    const { inputMode, setInputMode } = useHarmonic();
    const { isInstalled, needRefresh, updateServiceWorker, installApp, canInstall, hardReset } = usePWA();
    const { settings: notationSettings, updateSettings: updateNotationSettings } = useNotation();
    const [activeTab, setActiveTab] = React.useState<'appearance' | 'input' | 'install' | 'notation'>('input');

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Impostazioni</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-[#333] mb-4">
                    <button
                        className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${activeTab === 'input' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        onClick={() => setActiveTab('input')}
                    >
                        Input
                        {activeTab === 'input' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></div>
                        )}
                    </button>
                    <button
                        className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${activeTab === 'notation' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        onClick={() => setActiveTab('notation')}
                    >
                        Notazione
                        {activeTab === 'notation' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></div>
                        )}
                    </button>
                    <button
                        className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${activeTab === 'appearance' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        onClick={() => setActiveTab('appearance')}
                    >
                        Aspetto
                        {activeTab === 'appearance' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></div>
                        )}
                    </button>
                    <button
                        className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${activeTab === 'install' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        onClick={() => setActiveTab('install')}
                    >
                        App
                        {activeTab === 'install' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></div>
                        )}
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                    {activeTab === 'appearance' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-3">Tema / Palette Colori</label>
                                <div className="grid grid-cols-1 gap-3">
                                    <ThemeButton
                                        active={theme === 'alchemy'}
                                        onClick={() => setTheme('alchemy')}
                                        label="Alchemy Fluo"
                                        colors={['#81c784', '#64b5f6', '#e57373']}
                                    />
                                    <ThemeButton
                                        active={theme === 'deuteranopia'}
                                        onClick={() => setTheme('deuteranopia')}
                                        label="Deuteranopia (Alto Contrasto)"
                                        colors={['#56B4E9', '#F0E442', '#D55E00']}
                                    />
                                    <ThemeButton
                                        active={theme === 'protanopia'}
                                        onClick={() => setTheme('protanopia')}
                                        label="Protanopia"
                                        colors={['#4477AA', '#DDCC77', '#CC6677']}
                                    />
                                    <ThemeButton
                                        active={theme === 'tritanopia'}
                                        onClick={() => setTheme('tritanopia')}
                                        label="Tritanopia"
                                        colors={['#CC6677', '#117733', '#DDCC77']}
                                    />
                                    <ThemeButton
                                        active={theme === 'high_contrast'}
                                        onClick={() => setTheme('high_contrast')}
                                        label="Alto Contrasto (Vibrant)"
                                        colors={['#FF1493', '#00BFFF', '#FFD700']}
                                    />
                                    <ThemeButton
                                        active={theme === 'custom'}
                                        onClick={() => setTheme('custom')}
                                        label="Personalizzato"
                                        colors={[customColors.root, customColors.third, customColors.fifth]}
                                    />
                                </div>

                                {theme === 'custom' && (
                                    <div className="mt-4 grid grid-cols-2 gap-3 p-4 bg-[#222] rounded-xl border border-[#333]">
                                        <ColorPicker label="Tonica (Root)" value={customColors.root} onChange={(c) => setCustomColors({ ...customColors, root: c })} />
                                        <ColorPicker label="Terza (Third)" value={customColors.third} onChange={(c) => setCustomColors({ ...customColors, third: c })} />
                                        <ColorPicker label="Quinta (Fifth)" value={customColors.fifth} onChange={(c) => setCustomColors({ ...customColors, fifth: c })} />
                                        <ColorPicker label="Settima (Seventh)" value={customColors.seventh} onChange={(c) => setCustomColors({ ...customColors, seventh: c })} />
                                        <ColorPicker label="Estensioni" value={customColors.ext} onChange={(c) => setCustomColors({ ...customColors, ext: c })} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'input' && (
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
                    )}

                    {activeTab === 'install' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-3">Stato Applicazione</label>
                                <div className="p-4 bg-[#222] rounded-xl border border-[#333] mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${isInstalled ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                        <span className="text-white font-medium">
                                            {isInstalled ? 'App Installata' : 'Esecuzione nel Browser'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Versione: {__APP_VERSION__}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {/* Install Button */}
                                    {!isInstalled && canInstall && (
                                        <button
                                            onClick={installApp}
                                            className="w-full p-4 rounded-xl border border-blue-500/50 bg-blue-900/20 hover:bg-blue-900/30 transition-all text-left group"
                                        >
                                            <div className="font-medium text-blue-400 group-hover:text-blue-300">Installa App</div>
                                            <div className="text-xs text-blue-500/70 mt-1">Aggiungi alla schermata home per un'esperienza migliore.</div>
                                        </button>
                                    )}

                                    {/* Update Button */}
                                    {needRefresh && (
                                        <button
                                            onClick={() => updateServiceWorker(true)}
                                            className="w-full p-4 rounded-xl border border-green-500/50 bg-green-900/20 hover:bg-green-900/30 transition-all text-left"
                                        >
                                            <div className="font-medium text-green-400">Aggiornamento Disponibile</div>
                                            <div className="text-xs text-green-500/70 mt-1">Clicca per installare la nuova versione.</div>
                                        </button>
                                    )}

                                    {/* Hard Reset Button */}
                                    <button
                                        onClick={() => {
                                            if (confirm("Sei sicuro? Questo ricaricherà la pagina e pulirà la cache dell'applicazione.")) {
                                                hardReset();
                                            }
                                        }}
                                        className="w-full p-4 rounded-xl border border-red-900/50 bg-red-900/10 hover:bg-red-900/20 transition-all text-left group"
                                    >
                                        <div className="font-medium text-red-400 group-hover:text-red-300">Reinstalla / Reset Completo</div>
                                        <div className="text-xs text-red-500/70 mt-1">
                                            Risolve problemi di visualizzazione reinstallando l'app da zero (pulisce cache e Service Worker).
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notation' && (
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
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

const ThemeButton: React.FC<{ active: boolean; onClick: () => void; label: string; colors: string[] }> = ({ active, onClick, label, colors }) => (
    <button
        onClick={onClick}
        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${active
            ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
            : 'bg-[#222] border-[#333] hover:border-gray-500'
            }`}
    >
        <div className="flex items-center gap-3">
            <div className="flex gap-1" title="Root, Third, Fifth colors">
                {colors.map((c, i) => (
                    <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }}></div>
                ))}
            </div>
            <span className="font-medium text-white text-sm">{label}</span>
        </div>
        {active && (
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        )}
    </button>
);

const ColorPicker: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
    <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400">{label}</label>
        <div className="flex items-center gap-2">
            <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                title={label}
            />
            <span className="text-xs font-mono text-gray-300 uppercase">{value}</span>
        </div>
    </div>
);

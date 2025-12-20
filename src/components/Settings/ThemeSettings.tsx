import React from 'react';
import { useTheme } from '../../context/ThemeContext';

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

export const ThemeSettings: React.FC = () => {
    const { theme, setTheme, customColors, setCustomColors } = useTheme();

    return (
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
    );
};

import React from 'react';
import { useHarmonic } from '../../context/HarmonicContext';

interface CardProps {
    label: string;
    subLabel?: string;
    value: string;
    isActive: boolean;
    color: string;
    noteName?: string;
    className?: string;
}

const Card: React.FC<CardProps> = ({ label, subLabel, value, isActive, color, noteName, className = '' }) => {
    return (
        <div
            className={`
                relative flex flex-col p-4 rounded-2xl border transition-all duration-300 overflow-hidden min-h-[100px]
                ${isActive ? 'shadow-lg' : 'bg-[#18181b] border-white/5'}
                ${className}
            `}
            style={{
                borderColor: isActive ? `var(${color})` : 'rgba(255,255,255,0.05)',
                backgroundColor: isActive ? `color-mix(in srgb, var(${color}), transparent 90%)` : '#18181b', // Very subtle tint
                boxShadow: isActive ? `0 0 30px color-mix(in srgb, var(${color}), transparent 90%)` : 'none'
            }}
        >
            {/* Header */}
            {/* Header */}
            <div className="flex flex-row items-baseline gap-3 z-10 mb-2">
                {subLabel && (
                    <span
                        className="text-2xl font-serif font-black italic leading-none"
                        style={{ color: isActive ? `var(${color})` : '#3f3f46' }}
                    >
                        {subLabel}
                    </span>
                )}
                <span
                    className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30"
                >
                    {label}
                </span>
            </div>

            {/* Content */}
            <div className="flex items-end justify-between mt-auto gap-3 z-10">
                <span className="text-xl md:text-2xl font-bold text-white tracking-tight leading-none truncate">
                    {value}
                </span>

                {noteName && isActive && (
                    <div
                        className="flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-mono font-bold backdrop-blur-sm"
                        style={{
                            backgroundColor: `color-mix(in srgb, var(${color}), transparent 85%)`,
                            color: `var(${color})`,
                            border: `1px solid color-mix(in srgb, var(${color}), transparent 70%)`
                        }}
                    >
                        {noteName}
                    </div>
                )}
            </div>

            {/* Decorative background glow */}
            {isActive && (
                <div
                    className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20"
                    style={{ backgroundColor: `var(${color})` }}
                />
            )}
        </div>
    );
};

const THEME_COLORS = {
    root: '--col-root',
    third: '--col-third',
    fifth: '--col-fifth',
    seventh: '--col-seventh',
    ext: '--col-ext'
};

export const AnalysisGrid: React.FC = () => {
    const { analysis } = useHarmonic();
    const { rootName, quality, stability, function: func, extensions, flags, intervals, noteNames } = analysis;
    const { isRootActive, isThirdActive, isFifthActive, isSeventhActive } = flags;

    const isExtensionsActive = extensions.length > 0;

    const getNoteName = (type: string) => {
        for (const [noteId, intervalType] of intervals.entries()) {
            if (intervalType === type) {
                return noteNames.get(noteId);
            }
        }
        return undefined;
    };

    const thirdNote = getNoteName('third');
    const fifthNote = getNoteName('fifth');
    const seventhNote = getNoteName('seventh');

    // Helper to find extension notes
    const getExtensionNote = (extLabel: string) => {
        let targetInterval = -1;
        if (extLabel === "b9") targetInterval = 1;
        else if (extLabel === "9") targetInterval = 2;
        else if (extLabel === "#9") targetInterval = 3;
        else if (extLabel === "11") targetInterval = 5;
        else if (extLabel === "#11") targetInterval = 6;
        else if (extLabel === "b13") targetInterval = 8;
        else if (extLabel === "13") targetInterval = 9;
        else if (extLabel === "#13") targetInterval = 10;

        if (targetInterval === -1) return null;

        // Find root pitch
        let rootPitch = 0;
        let rootFound = false;
        for (const [n, type] of intervals.entries()) {
            if (type === 'root') {
                rootPitch = n % 12;
                rootFound = true;
                break;
            }
        }
        if (!rootFound) return null;

        // Find note matching interval
        for (const n of intervals.keys()) {
            const pitch = n % 12;
            const interval = (pitch - rootPitch + 12) % 12;
            if (interval === targetInterval) {
                return noteNames.get(n);
            }
        }
        return null;
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                <Card
                    label="Fondamentale"
                    subLabel="I"
                    value={rootName}
                    isActive={isRootActive}
                    color={THEME_COLORS.root}
                />
                <Card
                    label="Qualità"
                    subLabel="III"
                    value={quality}
                    isActive={isThirdActive}
                    color={THEME_COLORS.third}
                    noteName={thirdNote}
                />
                <Card
                    label="Stabilità"
                    subLabel="V"
                    value={stability}
                    isActive={isFifthActive}
                    color={THEME_COLORS.fifth}
                    noteName={fifthNote}
                />
                <Card
                    label="Funzione"
                    subLabel="VII"
                    value={func}
                    isActive={isSeventhActive}
                    color={THEME_COLORS.seventh}
                    noteName={seventhNote}
                />
            </div>

            {/* Extensions Card */}
            <div
                className={`
                    relative flex flex-col p-5 rounded-2xl border transition-all duration-300 overflow-hidden
                    ${isExtensionsActive ? 'shadow-lg' : 'bg-[#18181b] border-white/5'}
                `}
                style={{
                    borderColor: isExtensionsActive ? `var(${THEME_COLORS.ext})` : 'rgba(255,255,255,0.05)',
                    backgroundColor: isExtensionsActive ? `color-mix(in srgb, var(${THEME_COLORS.ext}), transparent 90%)` : '#18181b',
                    boxShadow: isExtensionsActive ? `0 0 30px color-mix(in srgb, var(${THEME_COLORS.ext}), transparent 90%)` : 'none'
                }}
            >
                <div className="flex items-center gap-3 mb-4 z-10">
                    <span
                        className="text-[10px] font-bold uppercase tracking-[0.2em]"
                        style={{ color: isExtensionsActive ? `var(${THEME_COLORS.ext})` : '#71717a' }}
                    >
                        Estensioni
                    </span>
                    <div className="h-px flex-1 bg-white/5"></div>
                </div>

                <div className="relative z-10 min-h-[40px] flex items-center">
                    {extensions.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                            {extensions.map((ext, i) => {
                                const noteName = getExtensionNote(ext);
                                return (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-sm transition-transform hover:scale-105"
                                        style={{
                                            backgroundColor: `color-mix(in srgb, var(${THEME_COLORS.ext}), transparent 85%)`,
                                            borderColor: `color-mix(in srgb, var(${THEME_COLORS.ext}), transparent 70%)`
                                        }}
                                    >
                                        <span className="text-lg font-bold text-white leading-none">{ext}</span>
                                        {noteName && (
                                            <span
                                                className="text-xs font-mono opacity-80"
                                                style={{ color: `var(${THEME_COLORS.ext})` }}
                                            >
                                                {noteName}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <span className="text-2xl font-bold text-white/20">--</span>
                    )}
                </div>

                {/* Decorative background glow for extensions */}
                {isExtensionsActive && (
                    <div
                        className="absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-15"
                        style={{ backgroundColor: `var(${THEME_COLORS.ext})` }}
                    />
                )}
            </div>
        </div>
    );
};

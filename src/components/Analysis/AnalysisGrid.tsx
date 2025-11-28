import React from 'react';
import { useHarmonic } from '../../context/HarmonicContext';

interface CardProps {
    id: string;
    label: string;
    roman?: string;
    value: string;
    isActive: boolean;
    color: string;
}

const Card: React.FC<CardProps> = ({ id, label, roman, value, isActive, color }) => {
    return (
        <div
            id={id}
            className={`
                relative flex flex-col justify-center items-center text-center p-3 rounded-2xl border transition-all duration-300 min-h-[90px] md:flex-row md:justify-between md:text-left md:min-h-[70px]
                ${isActive ? 'bg-opacity-15 shadow-[0_0_15px_rgba(0,0,0,0.2)]' : 'bg-[#121212] border-[#333]'}
            `}
            style={{
                borderColor: isActive ? color : '#333',
                backgroundColor: isActive ? `${color}26` : '#121212', // 26 is ~15% opacity hex
                boxShadow: isActive ? `0 0 15px ${color}33` : 'none' // 33 is ~20% opacity hex
            }}
        >
            <div className="flex md:flex-row flex-col items-center gap-2 md:gap-3">
                {roman && <div className="text-2xl opacity-80">{roman}</div>}
                <div
                    className="label text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: isActive ? color : '#6b7280' }} // Gray-500 if inactive
                >
                    {label}
                </div>
            </div>
            <div className="value text-xl md:text-2xl font-bold leading-tight text-white">
                {value}
            </div>
        </div>
    );
};

const THEME_COLORS = {
    root: '#81c784',
    third: '#64b5f6',
    fifth: '#e57373',
    seventh: '#ffd54f',
    ext: '#ba68c8'
};

export const AnalysisGrid: React.FC = () => {
    const { analysis } = useHarmonic();
    const { rootName, quality, stability, function: func, extensions } = analysis;

    const isRootActive = rootName !== '--';
    const isQualityActive = Array.from(analysis.intervals.values()).includes('third');
    const isStabilityActive = stability !== '--' && stability !== 'Omessa';
    const isFunctionActive = func !== '--' && func !== 'Triade';
    const isExtensionsActive = extensions.length > 0;

    return (
        <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
                <Card
                    id="node-root"
                    label="1. Fondamentale"
                    roman="Ⅰ"
                    value={rootName}
                    isActive={isRootActive}
                    color={THEME_COLORS.root}
                />
                <Card
                    id="node-char"
                    label="2. Qualità"
                    roman="Ⅲ"
                    value={quality}
                    isActive={isQualityActive}
                    color={THEME_COLORS.third}
                />
                <Card
                    id="node-stab"
                    label="3. Stabilità"
                    roman="Ⅴ"
                    value={stability}
                    isActive={isStabilityActive}
                    color={THEME_COLORS.fifth}
                />
                <Card
                    id="node-func"
                    label="4. Funzione"
                    roman="Ⅶ"
                    value={func}
                    isActive={isFunctionActive}
                    color={THEME_COLORS.seventh}
                />
            </div>

            {/* Extensions Card */}
            <div
                id="node-ext"
                className={`
                    relative flex flex-col justify-center items-center text-center p-3 rounded-2xl border transition-all duration-300 min-h-[90px] md:flex-row md:justify-between md:text-left md:min-h-[70px]
                `}
                style={{
                    borderColor: isExtensionsActive ? THEME_COLORS.ext : '#333',
                    backgroundColor: isExtensionsActive ? `${THEME_COLORS.ext}26` : '#121212',
                    boxShadow: isExtensionsActive ? `0 0 15px ${THEME_COLORS.ext}33` : 'none'
                }}
            >
                <div className="w-full">
                    <div
                        className="label text-[10px] font-bold uppercase tracking-widest mb-1 text-center md:text-left"
                        style={{ color: isExtensionsActive ? THEME_COLORS.ext : '#6b7280' }}
                    >
                        Estensioni
                    </div>
                    <div className="value text-2xl font-bold text-center md:text-left text-white">
                        {extensions.length > 0 ? extensions.join(', ') : '--'}
                    </div>
                </div>
            </div>
        </div>
    );
};

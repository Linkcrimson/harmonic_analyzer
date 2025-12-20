import React from 'react';
import { useHarmonic } from '../../context/HarmonicContext';
import { useLanguage } from '../../context/LanguageContext';
import { Tooltip, TooltipInfo } from '../Tooltip';

interface EnharmonicToggleProps {
    activeTooltip: { type: string; info: TooltipInfo } | null;
    onOpenTooltip: (type: string, info: TooltipInfo) => void;
    onCancelClose: () => void;
    onScheduleClose: () => void;
}

export const EnharmonicToggle: React.FC<EnharmonicToggleProps> = ({
    activeTooltip,
    onOpenTooltip,
    onCancelClose,
    onScheduleClose
}) => {
    const { checkEnharmonic, toggleEnharmonic } = useHarmonic();
    const { language } = useLanguage();

    const getContent = () => (
        <div className="flex flex-col gap-3 text-left">
            <div
                className={`cursor-pointer hover:bg-white/5 p-1 -m-1 rounded transition-colors ${!checkEnharmonic ? 'opacity-50 hover:opacity-100' : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!checkEnharmonic) toggleEnharmonic();
                }}
            >
                <div className={`font-bold mb-0.5 flex items-center gap-1 ${checkEnharmonic ? 'text-blue-400' : 'text-gray-400'}`}>
                    <span className="font-serif text-lg">♮</span> {language === 'it' ? "Ortografia Semplificata" : "Simplified Spelling"}
                </div>
                <div className="text-[10px] text-gray-500 leading-tight">
                    {language === 'it'
                        ? "La priorità è la facilità di lettura, non la correttezza armonica."
                        : "Priority is readability, not harmonic correctness."}
                </div>
            </div>
            <div className="border-t border-[#333] pt-2">
                <div
                    className={`cursor-pointer hover:bg-white/5 p-1 -m-1 rounded transition-colors ${checkEnharmonic ? 'opacity-50 hover:opacity-100' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (checkEnharmonic) toggleEnharmonic();
                    }}
                >
                    <div className={`font-bold mb-0.5 flex items-center gap-1 ${!checkEnharmonic ? 'text-blue-400' : 'text-gray-400'}`}>
                        <span className="font-serif text-lg">𝄫</span> {language === 'it' ? "Rigore Armonico" : "Harmonic Rigor"}
                    </div>
                    <div className="text-[10px] text-gray-500 leading-tight">
                        {language === 'it'
                            ? "Le note sono scritte rispettando la loro funzione teorica."
                            : "Notes are written respecting their theoretical function."}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div
            className="flex items-center h-10 md:h-11 bg-[#1a1a1a] p-1 border border-[#333] rounded-xl shadow-inner relative group cursor-pointer transition-all duration-300 hover:border-blue-500/50 tooltip-trigger"
            onMouseEnter={(e) => {
                onCancelClose();
                const rect = e.currentTarget.getBoundingClientRect();
                onOpenTooltip('enharmonic', {
                    title: language === 'it' ? "ORTOGRAFIA MUSICALE" : "MUSICAL SPELLING",
                    content: null, // Will be filled by the render below or re-generated if we passed it up. 
                    // Actually, passing null and rendering Tooltip locally is cleaner.
                    x: rect.left + (rect.width / 2),
                    y: rect.bottom,
                    containerWidth: rect.width,
                    clientY: e.clientY
                });
            }}
            onMouseLeave={onScheduleClose}
            onClick={() => {
                toggleEnharmonic();
            }}
            onTouchStart={(e) => {
                onCancelClose();
                const rect = e.currentTarget.getBoundingClientRect();
                onOpenTooltip('enharmonic', {
                    title: language === 'it' ? "ORTOGRAFIA MUSICALE" : "MUSICAL SPELLING",
                    content: null,
                    x: rect.left + (rect.width / 2),
                    y: rect.bottom,
                    containerWidth: rect.width,
                    clientY: (e as unknown as React.TouchEvent).touches[0].clientY
                });
            }}
        >
            {/* Animated Spelling Label - To the LEFT */}
            <div className="overflow-hidden max-w-0 group-hover:max-w-[70px] transition-all duration-500 ease-in-out">
                <span className="text-[9px] uppercase font-bold text-blue-500/70 ml-2 mr-1 select-none tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity duration-300">Spelling</span>
            </div>

            <div className="flex items-center h-full">
                <div className={`w-8 md:w-10 h-full flex items-center justify-center rounded-lg transition-all ${checkEnharmonic
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                    : 'text-gray-600 hover:text-gray-400'}`}>
                    <span className="text-xl font-serif select-none leading-none">♮</span>
                </div>
                <div className={`w-8 md:w-10 h-full flex items-center justify-center rounded-lg transition-all ${!checkEnharmonic
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                    : 'text-gray-600 hover:text-gray-400'}`}>
                    <span className="text-xl font-serif select-none leading-none">𝄫</span>
                </div>
            </div>

            {activeTooltip?.type === 'enharmonic' && (
                <Tooltip
                    info={{ ...activeTooltip.info, content: getContent() }}
                    forcePosition="bottom"
                    onMouseEnter={onCancelClose}
                    onMouseLeave={onScheduleClose}
                />
            )}
        </div>
    );
};

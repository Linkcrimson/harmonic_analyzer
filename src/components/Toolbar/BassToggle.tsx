import React from 'react';
import { useHarmonic } from '../../context/HarmonicContext';
import { useLanguage } from '../../context/LanguageContext';
import { Tooltip, TooltipInfo } from '../Tooltip';

interface BassToggleProps {
    activeTooltip: { type: string; info: TooltipInfo } | null;
    onOpenTooltip: (type: string, info: TooltipInfo) => void;
    onCancelClose: () => void;
    onScheduleClose: () => void;
}

export const BassToggle: React.FC<BassToggleProps> = ({
    activeTooltip,
    onOpenTooltip,
    onCancelClose,
    onScheduleClose
}) => {
    const { forceBassAsRoot, toggleBassAsRoot } = useHarmonic();
    const { language } = useLanguage();

    const getContent = () => (
        <div className="flex flex-col gap-3 text-left">
            <div
                className={`cursor-pointer hover:bg-white/5 p-1 -m-1 rounded transition-colors ${!forceBassAsRoot ? 'opacity-50 hover:opacity-100' : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!forceBassAsRoot) toggleBassAsRoot();
                }}
            >
                <div className={`font-bold mb-0.5 flex items-center gap-1 ${forceBassAsRoot ? 'text-blue-400' : 'text-gray-400'}`}>
                    {language === 'it' ? "Basso come Fondamentale" : "Bass as Root"}
                </div>
                <div className="text-[10px] text-gray-500 leading-tight">
                    {language === 'it'
                        ? "Considera la nota più bassa come la fondamentale dell'accordo, ignorando i rivolti."
                        : "Treats the lowest note as the chord's root, bypassing theoretical inversions."}
                </div>
            </div>
            <div className="border-t border-[#333] pt-2">
                <div
                    className={`cursor-pointer hover:bg-white/5 p-1 -m-1 rounded transition-colors ${forceBassAsRoot ? 'opacity-50 hover:opacity-100' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (forceBassAsRoot) toggleBassAsRoot();
                    }}
                >
                    <div className={`font-bold mb-0.5 flex items-center gap-1 ${!forceBassAsRoot ? 'text-blue-400' : 'text-gray-400'}`}>
                        {language === 'it' ? "Fondamentale Automatica" : "Automatic Root"}
                    </div>
                    <div className="text-[10px] text-gray-500 leading-tight">
                        {language === 'it'
                            ? "Analisi intelligente: il sistema identifica la fondamentale teorica corretta indipendentemente dal rivolto."
                            : "Smart analysis: the system identifies the correct theoretical root regardless of the inversion."}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div
            className={`flex items-center h-10 md:h-11 p-1 bg-[#1a1a1a] border border-[#333] rounded-xl relative group cursor-pointer transition-all duration-300 hover:border-blue-500/50 tooltip-trigger ${forceBassAsRoot ? 'shadow-[0_0_15px_rgba(59,130,246,0.2)]' : ''}`}
            onMouseEnter={(e) => {
                onCancelClose();
                const rect = e.currentTarget.getBoundingClientRect();
                onOpenTooltip('bass', {
                    title: language === 'it' ? "RIFERIMENTO FONDAMENTALE" : "ROOT REFERENCE",
                    content: null,
                    x: rect.left + (rect.width / 2),
                    y: rect.bottom,
                    containerWidth: rect.width,
                    clientY: e.clientY
                });
            }}
            onMouseLeave={onScheduleClose}
            onClick={() => {
                toggleBassAsRoot();
                onCancelClose();
            }}
            onTouchStart={(e) => {
                onCancelClose();
                const rect = e.currentTarget.getBoundingClientRect();
                onOpenTooltip('bass', {
                    title: language === 'it' ? "RIFERIMENTO FONDAMENTALE" : "ROOT REFERENCE",
                    content: null,
                    x: rect.left + (rect.width / 2),
                    y: rect.bottom,
                    containerWidth: rect.width,
                    clientY: (e as unknown as React.TouchEvent).touches[0].clientY
                });
            }}
        >
            {/* Animated Root Label - To the LEFT */}
            <div className="overflow-hidden max-w-0 group-hover:max-w-[100px] transition-all duration-500 ease-in-out">
                <span className="text-[9px] uppercase font-bold text-blue-500/70 ml-2 mr-1 select-none tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {language === 'it' ? "Fondamentale" : "Root"}
                </span>
            </div>

            <div className={`w-8 md:w-10 h-full flex items-center justify-center rounded-lg transition-all ${forceBassAsRoot ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle
                        cx="12" cy="8" r={forceBassAsRoot ? "4" : "5.5"}
                        fill={forceBassAsRoot ? "none" : "currentColor"}
                        stroke={forceBassAsRoot ? "currentColor" : "none"}
                        strokeWidth={forceBassAsRoot ? "2" : "0"}
                        className="transition-all duration-500 ease-out"
                    />
                    <rect
                        x="4" y={forceBassAsRoot ? "15" : "16"}
                        width="16" height={forceBassAsRoot ? "6" : "4"}
                        rx="2"
                        fill={forceBassAsRoot ? "currentColor" : "none"}
                        stroke={forceBassAsRoot ? "none" : "currentColor"}
                        strokeWidth={forceBassAsRoot ? "0" : "2"}
                        className="transition-all duration-500 ease-out"
                    />
                    <line
                        x1="12" y1="12" x2="12" y2="16"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        className={`transition-opacity duration-300 ${forceBassAsRoot ? 'opacity-0' : 'opacity-40'}`}
                    />
                </svg>
            </div>

            {activeTooltip?.type === 'bass' && (
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

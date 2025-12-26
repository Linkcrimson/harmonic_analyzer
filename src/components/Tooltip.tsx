import React from 'react';
import ReactDOM from 'react-dom';

export interface TooltipInfo {
    title: string;
    content: React.ReactNode;
    x: number;
    y: number;
    containerWidth: number;
    clientY: number;
}

interface TooltipProps {
    info: TooltipInfo;
    forcePosition?: 'top' | 'bottom';
    variant?: 'floating' | 'modal';
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

export const Tooltip: React.FC<TooltipProps> = ({ info, forcePosition, variant = 'floating', onMouseEnter, onMouseLeave }) => {
    // -------------------------------------------------------------------------
    // RENDER MODAL VARIANT
    // -------------------------------------------------------------------------
    if (variant === 'modal') {
        return ReactDOM.createPortal(
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 pointer-events-none"
            >
                <div
                    className="relative bg-[#1a1a1a] border border-[#333] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] text-gray-200 w-full max-w-[320px] overflow-hidden transform transition-all duration-300 scale-100 opacity-100 select-none cursor-default tooltip-box flex flex-col pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                >
                    <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                    <div className="p-5">
                        <div className="font-bold text-[#f0f0f0] mb-3 uppercase tracking-[0.1em] text-xs border-b border-[#333] pb-2 flex justify-between items-center">
                            <span>{info.title}</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                        </div>
                        <div className="leading-relaxed text-sm text-gray-300 whitespace-pre-line">
                            {info.content}
                        </div>
                    </div>
                    <div className="px-5 pb-4 text-[10px] text-gray-500 text-center italic">
                        Tocca ovunque per chiudere
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    // -------------------------------------------------------------------------
    // RENDER FLOATING VARIANT (Original logic)
    // -------------------------------------------------------------------------
    const padding = 10;
    const tooltipWidth = 220;
    let boxLeft = info.x - (tooltipWidth / 2);
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;

    if (boxLeft < padding) {
        boxLeft = padding;
    } else if (boxLeft + tooltipWidth > screenWidth - padding) {
        boxLeft = screenWidth - padding - tooltipWidth;
    }

    const relativeCursorX = info.x - boxLeft;
    const arrowX = Math.max(12, Math.min(tooltipWidth - 12, relativeCursorX));
    const tooltipHeightApprox = 150;
    const isTooHigh = forcePosition === 'bottom' ? true : (forcePosition === 'top' ? false : info.clientY < tooltipHeightApprox);
    const topPos = isTooHigh ? info.y + 12 : info.y - 12;
    const transformY = isTooHigh ? '0%' : '-100%';
    const arrowYClass = isTooHigh ? 'top-0 -translate-y-1/2' : 'bottom-0 translate-y-1/2';
    const arrowBorderClass = isTooHigh ? 'border-l border-t' : 'border-r border-b';

    return ReactDOM.createPortal(
        <div
            className="fixed z-[9999] px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] text-sm text-gray-200 w-[220px] text-center backdrop-blur-sm transition-all duration-75 select-none cursor-default tooltip-box"
            style={{
                left: boxLeft,
                top: topPos,
                transform: `translateY(${transformY})`,
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="font-bold text-[#e0e0e0] mb-2 uppercase tracking-wider text-xs border-b border-[#333] pb-1">
                {info.title}
            </div>
            <div className="leading-relaxed text-xs whitespace-pre-line">
                {info.content}
            </div>
            <div
                className={`absolute w-3 h-3 bg-[#1a1a1a] border-[#333] ${arrowYClass} ${arrowBorderClass}`}
                style={{
                    left: arrowX,
                    transform: isTooHigh ? 'translate(-50%, -50%) rotate(45deg)' : 'translate(-50%, 50%) rotate(45deg)'
                }}
            ></div>
        </div>,
        document.body
    );
};

import React from 'react';

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
}

export const Tooltip: React.FC<TooltipProps> = ({ info, forcePosition }) => {
    // Smart Positioning System
    const padding = 20; // safe area from edges of the container
    const tooltipWidth = 220; // Fixed width

    // 1. Calculate ideal left position (centered on cursor)
    let boxLeft = info.x - (tooltipWidth / 2);

    // 2. Clamp to container bounds
    if (boxLeft < padding) {
        boxLeft = padding;
    } else if (boxLeft + tooltipWidth > info.containerWidth - padding) {
        boxLeft = info.containerWidth - padding - tooltipWidth;
    }

    // 3. Calculate arrow position relative to the tooltip box
    const relativeCursorX = info.x - boxLeft;
    const arrowX = Math.max(12, Math.min(tooltipWidth - 12, relativeCursorX));

    // Vertical Flip Logic
    const tooltipHeightApprox = 150;
    const isTooHigh = forcePosition === 'bottom' ? true : (forcePosition === 'top' ? false : info.clientY < tooltipHeightApprox);

    // If bottom, place below cursor/element (+ offset). If top, place above.
    const topPos = isTooHigh ? info.y + 12 : info.y - 12;
    const transformY = isTooHigh ? '0%' : '-100%';

    const arrowYClass = isTooHigh ? 'top-0 -translate-y-1/2' : 'bottom-0 translate-y-1/2';
    const arrowBorderClass = isTooHigh ? 'border-l border-t' : 'border-r border-b';

    return (
        <div
            className="absolute z-[100] pointer-events-none px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] text-sm text-gray-200 w-[220px] text-center backdrop-blur-sm transition-all duration-75"
            style={{
                left: boxLeft,
                top: topPos,
                transform: `translateY(${transformY})`,
            }}
        >
            <div className="font-bold text-[#e0e0e0] mb-2 uppercase tracking-wider text-xs border-b border-[#333] pb-1">
                {info.title}
            </div>
            <div className="leading-relaxed text-xs">
                {info.content}
            </div>
            <div
                className={`absolute w-3 h-3 bg-[#1a1a1a] border-[#333] ${arrowYClass} ${arrowBorderClass}`}
                style={{
                    left: arrowX,
                    transform: isTooHigh ? 'translate(-50%, -50%) rotate(45deg)' : 'translate(-50%, 50%) rotate(45deg)'
                }}
            ></div>
        </div>
    );
};

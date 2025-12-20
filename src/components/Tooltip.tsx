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
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

export const Tooltip: React.FC<TooltipProps> = ({ info, forcePosition, onMouseEnter, onMouseLeave }) => {
    // Smart Positioning System
    const padding = 10; // safe area from edges of the screen
    const tooltipWidth = 220; // Fixed width

    // 1. Calculate ideal left position (centered on cursor)
    let boxLeft = info.x - (tooltipWidth / 2);

    // 2. Clamp to viewport bounds (window.innerWidth)
    // We use window.innerWidth instead of info.containerWidth to ensure it fits on screen
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;

    if (boxLeft < padding) {
        boxLeft = padding;
    } else if (boxLeft + tooltipWidth > screenWidth - padding) {
        boxLeft = screenWidth - padding - tooltipWidth;
    }

    // 3. Calculate arrow position relative to the tooltip box
    // The arrow points to info.x. 
    // relativeCursorX is the distance from the left edge of the tooltip box to the target point
    const relativeCursorX = info.x - boxLeft;
    // Clamp arrow so it doesn't detach from the box corners
    const arrowX = Math.max(12, Math.min(tooltipWidth - 12, relativeCursorX));

    // Vertical Flip Logic
    const tooltipHeightApprox = 150;
    // If not forced, check if there's space above (using clientY as approx cursor/trigger height)
    // Actually info.clientY is where the mouse/finger interaction happened (or rect.bottom)
    const isTooHigh = forcePosition === 'bottom' ? true : (forcePosition === 'top' ? false : info.clientY < tooltipHeightApprox);

    // If bottom, place below cursor/element (+ offset). If top, place above.
    const topPos = isTooHigh ? info.y + 12 : info.y - 12;
    // Fixed positioning: we don't use percentages for Y translation as easily with 'top' calc, 
    // but cleaner is:
    // If placing BELOW (isTooHigh=true), top = info.y + 12.
    // If placing ABOVE (isTooHigh=false), top = info.y - 12, and we translateY(-100%).
    const transformY = isTooHigh ? '0%' : '-100%';

    const arrowYClass = isTooHigh ? 'top-0 -translate-y-1/2' : 'bottom-0 translate-y-1/2';
    const arrowBorderClass = isTooHigh ? 'border-l border-t' : 'border-r border-b';

    return ReactDOM.createPortal(
        <div
            className="fixed z-[9999] px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] text-sm text-gray-200 w-[220px] text-center backdrop-blur-sm transition-all duration-75 select-none cursor-default"
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
        </div>,
        document.body
    );
};

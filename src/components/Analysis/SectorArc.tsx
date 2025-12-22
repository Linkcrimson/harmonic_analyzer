import React from 'react';

interface SectorArcProps {
    sector: {
        label: string;
        range: [number, number];
        type: string;
        colorVar: string;
        title: string;
        description: string;
    };
    getPoint: (idx: number, r?: number) => { x: number; y: number };
    radius: number;
    onMouseEnter: (title: string, content: React.ReactNode, e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseLeave: () => void;
    onClick: (title: string, content: React.ReactNode, e: React.MouseEvent) => void;
}

// Helper to draw arc path
const describeArc = (
    startIdx: number,
    endIdx: number,
    r: number,
    getPoint: (idx: number, r?: number) => { x: number; y: number }
) => {
    const start = getPoint(startIdx, r);
    const end = getPoint(endIdx, r);
    const largeArcFlag = Math.abs(endIdx - startIdx) * 30 > 180 ? 1 : 0;

    return [
        "M", start.x, start.y,
        "A", r, r, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
};

export const SectorArc: React.FC<SectorArcProps> = ({
    sector,
    getPoint,
    radius,
    onMouseEnter,
    onMouseMove,
    onMouseLeave,
    onClick
}) => {
    // Special case: Root is a single point, not an arc
    if (sector.type === 'root') {
        const pos = getPoint(0);
        return (
            <g>
                <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={20}
                    fill="transparent"
                    stroke="none"
                    onMouseEnter={(e) => onMouseEnter(sector.title, sector.description, e)}
                    onMouseMove={onMouseMove}
                    onMouseLeave={onMouseLeave}
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick(sector.title, sector.description, e);
                    }}
                    onTouchStart={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onClick(sector.title, sector.description, e as unknown as React.MouseEvent);
                        }
                    }}
                    style={{ cursor: 'help' }}
                    className="tooltip-trigger focus-visible:outline-none focus-visible:stroke-white focus-visible:stroke-[3px] select-none"
                    tabIndex={0}
                    role="button"
                    aria-label={sector.title}
                />
                <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={8}
                    fill="none"
                    stroke={`var(${sector.colorVar})`}
                    strokeWidth="3"
                    opacity="0.3"
                    pointerEvents="none"
                />
            </g>
        );
    }

    // Standard arc for other sectors
    const d = describeArc(sector.range[0], sector.range[1], radius, getPoint);

    return (
        <g>
            {/* Hit area (invisible) */}
            <path
                d={d}
                fill="none"
                stroke="transparent"
                strokeWidth="40"
                strokeLinecap="round"
                onMouseEnter={(e) => onMouseEnter(sector.title, sector.description, e)}
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick(sector.title, sector.description, e);
                }}
                onTouchStart={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onClick(sector.title, sector.description, e as unknown as React.MouseEvent);
                    }
                }}
                style={{ cursor: 'help' }}
                className="tooltip-trigger focus-visible:outline-none focus-visible:stroke-white focus-visible:stroke-[3px] select-none"
                tabIndex={0}
                role="button"
                aria-label={sector.title}
            />
            {/* Visible arc */}
            <path
                d={d}
                fill="none"
                stroke={`var(${sector.colorVar})`}
                strokeWidth="10"
                strokeLinecap="round"
                opacity="0.3"
                pointerEvents="none"
            />
        </g>
    );
};

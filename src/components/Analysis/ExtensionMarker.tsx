import React from 'react';
import { getDidacticExplanation } from '../../utils/didacticTooltips';
import { useLanguage } from '../../context/LanguageContext';

interface ExtensionMarkerProps {
    idx: number;
    note: {
        noteId: number;
        type: string;
        name: string;
    };
    pos: { x: number; y: number };
    labelPos: { x: number; y: number };
    contextIntervals: number[];
    onMouseEnter: (title: string, content: React.ReactNode, e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseLeave: () => void;
}

export const ExtensionMarker: React.FC<ExtensionMarkerProps> = ({
    idx,
    note,
    pos,
    labelPos,
    contextIntervals,
    onMouseEnter,
    onMouseMove,
    onMouseLeave
}) => {
    const { language, t } = useLanguage();
    const didactic = getDidacticExplanation(idx, contextIntervals, language);

    const content = (
        <div>
            <div className="font-bold text-white mb-1">{note.name}</div>
            <div className="text-gray-300">{didactic.title}</div>
            <div className="text-xs text-gray-400 mt-1">
                {idx} {idx === 1 ? t('general.semitone') : t('general.semitones')}
            </div>
            <div className="text-xs text-gray-500 mt-2 border-t border-gray-700 pt-1 text-left leading-relaxed">
                {didactic.description}
            </div>
        </div>
    );

    return (
        <g>
            {/* Ghost Hit Area */}
            <circle
                cx={pos.x}
                cy={pos.y}
                r={25}
                fill="transparent"
                stroke="none"
                onMouseEnter={(e) => onMouseEnter(didactic.title, content, e)}
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
                style={{ cursor: 'help' }}
                className="tooltip-trigger"
            />

            {/* Visible Marker */}
            <circle
                cx={pos.x}
                cy={pos.y}
                r={7}
                fill="var(--col-ext)"
                stroke="none"
                pointerEvents="none"
            />

            {/* Label */}
            <text
                x={labelPos.x}
                y={labelPos.y}
                fill="var(--col-ext)"
                fontSize="16"
                fontFamily="Inter, sans-serif"
                fontWeight="600"
                textAnchor="middle"
                alignmentBaseline="middle"
                pointerEvents="none"
            >
                {note.name}
            </text>
        </g>
    );
};

import React from 'react';
import { getIntervalColor } from '../../utils/intervalColors';
import { getDidacticExplanation } from '../../utils/didacticTooltips';
import { useLanguage } from '../../context/LanguageContext';

interface NoteMarkerProps {
    note: {
        idx: number;
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
    onClick: (title: string, content: React.ReactNode, e: React.MouseEvent) => void;
}

export const NoteMarker: React.FC<NoteMarkerProps> = ({
    note,
    pos,
    labelPos,
    contextIntervals,
    onMouseEnter,
    onMouseMove,
    onMouseLeave,
    onClick
}) => {
    const { language, t } = useLanguage();
    const didactic = getDidacticExplanation(note.idx, contextIntervals, language);

    const content = (
        <div>
            <div className="font-bold text-white mb-1">{note.name}</div>
            <div className="text-gray-300">{didactic.title}</div>
            <div className="text-xs text-gray-400 mt-1">
                {note.idx} {note.idx === 1 ? t('general.semitone') : t('general.semitones')}
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
                onClick={(e) => onClick(didactic.title, content, e)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onClick(didactic.title, content, e as unknown as React.MouseEvent);
                    }
                }}
                style={{ cursor: 'help' }}
                className="tooltip-trigger focus-visible:outline-none focus-visible:stroke-white focus-visible:stroke-[3px] select-none"
                tabIndex={0}

                role="button"
                aria-label={`${note.name} - ${didactic.title}`}
            />

            {/* Visible Marker */}
            <circle
                cx={pos.x}
                cy={pos.y}
                r={note.idx === 0 ? 10 : 7}
                fill={getIntervalColor(note.type)}
                stroke="none"
                pointerEvents="none"
            />

            {/* Label */}
            <text
                x={labelPos.x}
                y={labelPos.y}
                fill={getIntervalColor(note.type)}
                fontSize="16"
                fontFamily="Inter, sans-serif"
                fontWeight="700"
                textAnchor="middle"
                alignmentBaseline="middle"
                pointerEvents="none"
            >
                {note.name}
            </text>
        </g>
    );
};

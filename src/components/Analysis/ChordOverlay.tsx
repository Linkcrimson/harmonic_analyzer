import React from 'react';
import { ChordSymbol } from './ChordSymbol';

interface ChordOverlayProps {
    chordName: string;
    chordOption: any;
    radius: number;
}

export const ChordOverlay: React.FC<ChordOverlayProps> = ({
    chordName,
    chordOption,
    radius
}) => {
    if (chordName === '--' || !chordOption) return null;

    return (
        <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none flex justify-center items-center"
            style={{ width: radius * 1.5, height: radius * 1.5 }}
        >
            <div
                className="font-bold text-white drop-shadow-lg transition-all duration-200"
                style={{
                    fontSize: `${Math.max(2.5, 5 - (chordName.length * 0.15))}rem`
                }}
            >
                <ChordSymbol option={chordOption} />
            </div>
        </div>
    );
};

import React from 'react';
import { useHarmonic } from '../../context/HarmonicContext';
import { ChordSymbol } from './ChordSymbol';

export const ChordHeader: React.FC = () => {
    const { chordName, chordOptions, selectedOptionIndex } = useHarmonic();

    return (
        <div className="text-center lg:text-left py-2 md:py-4">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight drop-shadow-2xl mb-2">
                {chordName !== '--' && chordOptions[selectedOptionIndex] ? (
                    <ChordSymbol option={chordOptions[selectedOptionIndex]} />
                ) : '--'}
            </h2>
        </div>
    );
};

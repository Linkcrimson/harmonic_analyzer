import React, { useState } from 'react';
import { useHarmonic } from '../../context/HarmonicContext';

export const ChordAlternatives: React.FC = () => {
    const { chordOptions, selectedOptionIndex, selectChordOption } = useHarmonic();
    const [isExpanded, setIsExpanded] = useState(false);
    const VISIBLE_LIMIT = 3;

    if (chordOptions.length === 0) return null;

    return (
        <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-4 min-h-[2rem]">
            {chordOptions.slice(0, isExpanded ? undefined : VISIBLE_LIMIT).map((opt, index) => (
                <button
                    key={index}
                    onClick={() => selectChordOption(index)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition border ${index === selectedOptionIndex
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-gray-200'
                        }`}
                >
                    {opt.chordName}
                </button>
            ))}
            {chordOptions.length > VISIBLE_LIMIT && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="px-3 py-1 rounded-full text-xs font-medium transition border bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-gray-200"
                >
                    {isExpanded ? 'Meno' : '...'}
                </button>
            )}
        </div>
    );
};

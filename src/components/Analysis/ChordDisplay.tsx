import React from 'react';
import { useHarmonic } from '../../context/HarmonicContext';

export const ChordDisplay: React.FC = () => {
    const { chordName, chordOptions, selectedOptionIndex, selectChordOption } = useHarmonic();

    // Helper to render complex chord names (HTML logic ported to React)
    const renderChordName = () => {
        if (chordName === '--') return '--';

        // We need to parse the components from the current option to render it beautifully
        const currentOption = chordOptions[selectedOptionIndex];
        if (!currentOption) return chordName;

        const { components } = currentOption;
        const { rootName, quality } = components;
        let { base } = components;

        // Root Name with Accidentals
        const renderRoot = (name: string) => {
            const sharpIndex = name.indexOf('♯');
            const flatIndex = name.indexOf('♭');
            if (sharpIndex !== -1 || flatIndex !== -1) {
                const splitIndex = sharpIndex !== -1 ? sharpIndex : flatIndex;
                const notePart = name.substring(0, splitIndex);
                const accidentalPart = name.substring(splitIndex);
                return (
                    <span>
                        {notePart}
                        <span className="inline-block transform -translate-y-3 text-5xl">{accidentalPart}</span>
                    </span>
                );
            }
            return <span>{name}</span>;
        };

        // Base with Diminished/Half-Diminished symbol
        // Move b5 from quality to base
        const displayQuality = [...quality];
        const b5Index = displayQuality.indexOf("♭5");
        if (b5Index !== -1) {
            displayQuality.splice(b5Index, 1);
            base += "♭5";
        }
        base = base.replace("dim", "°");

        const renderBase = (baseStr: string) => {
            if (baseStr.includes("°")) {
                const parts = baseStr.split("°");
                return (
                    <span>
                        {parts[0]}
                        <span className="text-5xl align-top -mt-1 inline-block">°</span>
                        {parts[1]}
                    </span>
                );
            }
            return baseStr;
        };

        // Extensions/Quality
        const renderQuality = (qual: string[]) => {
            if (qual.length === 0) return null;
            if (qual.length > 1) {
                return (
                    <span className="inline-flex items-center align-top mx-1 -mt-2">
                        <span className="text-4xl text-gray-400 font-light mr-1 transform scale-y-150 origin-center">(</span>
                        <div className="flex flex-col justify-center leading-none text-center">
                            {qual.map((q, i) => (
                                <span key={i} className="text-xl text-gray-300 font-medium tracking-tight my-0.5">{q}</span>
                            ))}
                        </div>
                        <span className="text-4xl text-gray-400 font-light ml-1 transform scale-y-150 origin-center">)</span>
                    </span>
                );
            } else {
                return (
                    <span className="text-4xl align-top -mt-2 inline-block text-gray-300 font-medium tracking-normal ml-1">
                        {qual[0]}
                    </span>
                );
            }
        };

        // Inversion
        const renderInversion = (inv: string) => {
            if (!inv) return null;
            const sharpIndex = inv.indexOf('♯');
            const flatIndex = inv.indexOf('♭');

            if (sharpIndex !== -1 || flatIndex !== -1) {
                const splitIndex = sharpIndex !== -1 ? sharpIndex : flatIndex;
                const notePart = inv.substring(0, splitIndex);
                const accidentalPart = inv.substring(splitIndex);
                return (
                    <span className="ml-1">
                        {notePart}
                        <span className="inline-block transform -translate-y-3 text-5xl">{accidentalPart}</span>
                    </span>
                );
            }
            return <span className="ml-1">{inv}</span>;
        };

        return (
            <>
                {renderRoot(rootName)}
                {renderBase(base)}
                {renderQuality(displayQuality)}
                {renderInversion(components.inversion)}
            </>
        );
    };

    return (
        <div className="text-center lg:text-left py-2 md:py-4">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight drop-shadow-2xl mb-2">
                {renderChordName()}
            </h2>

            <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-4 min-h-[2rem]">
                {chordOptions.map((opt, index) => (
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
            </div>
        </div>
    );
};

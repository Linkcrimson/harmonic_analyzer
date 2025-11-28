import React from 'react';

interface ChordSymbolProps {
    option: any;
    className?: string;
}

export const ChordSymbol: React.FC<ChordSymbolProps> = ({ option, className = "" }) => {
    if (!option) return <span>--</span>;

    const { components } = option;
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
                <span className="inline-flex items-baseline">
                    {notePart}
                    <span className="text-[0.6em] -translate-y-[0.3em] ml-[0.05em]">{accidentalPart}</span>
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
        if (!baseStr) return null;

        // Handle diminished symbol specifically
        if (baseStr.includes("°")) {
            const parts = baseStr.split("°");
            return (
                <span className="text-[0.8em] font-medium ml-[0.05em]">
                    {parts[0]}
                    <span className="text-[0.8em] align-top -mt-[0.2em] inline-block">°</span>
                    {parts[1]}
                </span>
            );
        }

        // Standard base (m, maj, etc.) - slightly smaller than root
        return <span className="text-[0.8em] font-medium ml-[0.05em]">{baseStr}</span>;
    };

    // Extensions/Quality
    const renderQuality = (qual: string[]) => {
        if (qual.length === 0) return null;

        // Container for extensions - superscripted
        return (
            <span className="inline-flex flex-col justify-start ml-[0.1em] -translate-y-[0.3em] align-top">
                {qual.map((q, i) => (
                    <span key={i} className="text-[0.5em] font-medium leading-[0.9] tracking-tight">
                        {q}
                    </span>
                ))}
            </span>
        );
    };

    // Inversion
    const renderInversion = (inv: string) => {
        if (!inv) return null;

        // Remove leading slash if present (it comes from logic, but we want to control rendering)
        const cleanInv = inv.startsWith('/') ? inv.substring(1) : inv;

        const sharpIndex = cleanInv.indexOf('♯');
        const flatIndex = cleanInv.indexOf('♭');

        let content;
        if (sharpIndex !== -1 || flatIndex !== -1) {
            const splitIndex = sharpIndex !== -1 ? sharpIndex : flatIndex;
            const notePart = cleanInv.substring(0, splitIndex);
            const accidentalPart = cleanInv.substring(splitIndex);
            content = (
                <>
                    {notePart}
                    <span className="text-[0.7em] -translate-y-[0.3em] ml-[0.05em] inline-block">{accidentalPart}</span>
                </>
            );
        } else {
            content = cleanInv;
        }

        return (
            <span className="ml-[0.1em] text-[0.75em] text-gray-300">
                <span className="mx-[0.1em] text-[0.9em] font-light">/</span>
                {content}
            </span>
        );
    };

    return (
        <span className={`${className} inline-flex items-baseline whitespace-nowrap`}>
            {renderRoot(rootName)}
            {renderBase(base)}
            {/* Extensions and Inversions wrapper to keep them together if possible, or just flow */}
            <span className="inline-flex flex-col justify-start ml-[0.1em] -translate-y-[0.3em] align-top">
                {/* Quality/Extensions */}
                {displayQuality.length > 0 && (
                    <span className="inline-flex flex-wrap max-w-[120px]">
                        {displayQuality.map((q, i) => (
                            <span key={i} className="text-[0.5em] font-medium leading-[0.9] tracking-tight mr-[0.1em]">
                                {q}
                            </span>
                        ))}
                    </span>
                )}
            </span>
            {/* Inversion - keep it outside the superscript if it should be baseline, or inside if superscript. Usually baseline or slightly subscript. */}
            {/* Let's keep inversion baseline but small */}
            {renderInversion(components.inversion)}
        </span>
    );
};

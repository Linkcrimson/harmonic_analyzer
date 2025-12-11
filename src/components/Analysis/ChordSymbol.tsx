import React from 'react';
import { useNotation } from '../../context/NotationContext';
import { formatChordName } from '../../utils/chordNotation';

interface ChordSymbolProps {
    option: any;
    className?: string;
}

export const ChordSymbol: React.FC<ChordSymbolProps> = ({ option, className = "" }) => {
    const { settings } = useNotation();

    if (!option) return <span>--</span>;

    const { components } = option;
    const { rootName, quality } = components;
    let { base } = components;

    // Apply formatting to Base
    // We treat base as a partial chord name for replacement purposes
    // Major/Minor/Dim/Aug usually live here.
    base = formatChordName(base, settings);

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


    const displayQuality = [...quality];

    // Special handling for Half-Diminished if setting is NOT ø
    // not251 might represent half-dim as base="ø" or base="min" quality=["7", "b5"]
    // If base is "ø", formatChordName handles it.
    // If base is "min" and quality has "7","b5", we might want to check.

    // Check if we need to unify "min7b5" into the base if the user selected a block style like "-7b5"
    // Ideally formatChordName handles string replacement, but here we have components.

    // For now, let's trust formatChordName on 'base'.
    // And also potentially on quality items if they match 'omit' or 'aug' etc.
    const formattedQuality = displayQuality.map(q => formatChordName(q, settings));

    const renderBase = (baseStr: string) => {
        if (!baseStr) return null;

        // Handle diminished symbol specifically if it resulted in °
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
                {formattedQuality.length > 0 && (
                    <span className="inline-flex flex-wrap max-w-[120px]">
                        {formattedQuality.map((q, i) => (
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

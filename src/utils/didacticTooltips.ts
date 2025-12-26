import { TOOLTIPS_IT } from "../locales/tooltips_it";
import { TOOLTIPS_EN } from "../locales/tooltips_en";
import { LanguageCode } from "../context/LanguageContext";

export const getDidacticExplanation = (
    interval: number,
    contextIntervals: number[],
    lang: LanguageCode = 'it',
    analyzedType?: string  // Type already determined by not251 analysis
): { title: string; description: string } => {
    const has = (i: number) => contextIntervals.includes(i);
    const tooltips = lang === 'en' ? TOOLTIPS_EN : TOOLTIPS_IT;

    // Safe access helper
    const get = (key: string) => {
        // @ts-ignore
        return tooltips[key] || {
            title: `Missing Key: ${key}`,
            description: "Tooltip definition missing."
        };
    };

    // If we have an analyzed type from not251, use it directly
    // This avoids duplicating logic that not251 already computes
    if (analyzedType) {
        // Check if a seventh is present to distinguish add vs real extensions
        // Note: interval 9 (major 6th) is only a seventh in dim7 context, not in 6th chords
        // So we only count intervals 10 (min7) and 11 (maj7) as true sevenths
        const hasSeventh = has(10) || has(11);

        switch (analyzedType) {
            // Chord tones - fall through to contextual logic below
            case 'root': return get('root');
            case 'third':
                // Third can be major or minor, check context
                if (has(4)) return get('maj3');
                if (has(3)) return get('min3');
                // Sus chords: third is actually a 2nd or 4th
                if (has(2)) return get('sus2');
                if (has(5)) return get('sus4');
                return get('maj3'); // Fallback
            case 'fifth':
                if (has(8)) return get('aug5');
                if (has(6)) return get('dim5');
                return get('perf5');
            case 'seventh':
                if (has(11)) return get('maj7');
                if (has(10)) return get('min7_dom');
                // Interval 9: contextual based on chord type
                if (has(9)) {
                    // Diminished chord: m3 + dim5
                    if (has(3) && has(6)) return get('dim7_true');
                    // Minor sixth: m3 + perfect 5
                    if (has(3)) return get('sixth_min');
                    // Major sixth: M3 + perfect 5
                    if (has(4)) return get('sixth_maj');
                    return get('dim7_true'); // Fallback
                }
                return get('maj7'); // Fallback
            // Extensions - check if "add" (no seventh) or real extension
            case 'b9': return hasSeventh ? get('b9_dom') : get('addb9');
            case '9': return hasSeventh ? get('maj9') : get('add9');
            case '#9': return hasSeventh ? get('sharp9') : get('addsharp9');
            case '11': return hasSeventh ? get('p11_min') : get('add11');
            case '#11': return hasSeventh ? get('sharp11_lyd') : get('addsharp11');
            case 'b13': return hasSeventh ? get('b13_dom') : get('addb13');
            case '13': return hasSeventh ? get('maj13') : get('add13');
            case '#13': return hasSeventh ? get('sharp13') : get('addsharp13');
            case 'ext': break; // Fall through to contextual logic
        }
    }

    // Helper booleans for context
    // const hasMin2 = has(1);
    // const hasMaj2 = has(2);
    const hasMin3 = has(3);
    const hasMaj3 = has(4);
    // const hasP4 = has(5);
    const hasDim5 = has(6);
    const hasP5 = has(7);
    // const hasAug5 = has(8);
    // const hasMaj6 = has(9); // dim7 check
    const hasMin7 = has(10);
    const hasMaj7 = has(11);

    // 0: Root
    if (interval === 0) return get('root');

    // 1: Minor 2nd / b9
    if (interval === 1) {
        if (hasMaj3 && hasMin7) return get('b9_dom'); // Dominant b9 context
        if (hasMin3 && !hasP5) return get('b9_dim'); // Diminished context probably
        return get('b2_phryg'); // Default to Phrygian color
    }

    // 2: Major 2nd / 9
    if (interval === 2) {
        if (!hasMin3 && !hasMaj3) return get('sus2'); // Sus2
        if (hasMin7 || hasMaj7) return get('maj9');   // Extension 9
        return get('add9');                           // Add9 (no 7th)
    }

    // 3: Minor 3rd / #9
    if (interval === 3) {
        if (hasMaj3) return get('sharp9'); // Hendrix Chord #9
        return get('min3');                // Standard Minor 3rd
    }

    // 4: Major 3rd
    if (interval === 4) {
        return get('maj3'); // Standard Major 3rd
    }

    // 5: Perfect 4th / 11
    if (interval === 5) {
        if (!hasMin3 && !hasMaj3) return get('sus4'); // Sus4
        if (hasMaj3 && (hasMaj7 || hasMin7)) return get('p11_dom'); // 11 on Dom/Maj (Clash usually)
        if (hasMaj3 && !hasMin7 && !hasMaj7) return get('p4_avoid'); // Avoid on Triad
        return get('p11_min'); // 11 on Minor (Dorian)
    }

    // 6: Tritone (Diminished 5th / Aug 4th / #11)
    if (interval === 6) {
        if (hasMin7 && !hasP5) return get('dim5_7b5'); // 7b5
        if (hasMin3 && !hasP5) return get('dim5_dim'); // dim7 or dim triad
        if (hasMaj3 || hasMaj7) return get('sharp11_lyd'); // Lydian #11
        if (hasMaj3 && hasMin7) return get('sharp11_dom'); // Lydian Dominant
        return get('tritone'); // Generic
    }

    // 7: Perfect 5th
    if (interval === 7) return get('perf5');

    // 8: Augmented 5th / Minor 6th
    if (interval === 8) {
        if (hasMaj3 && !hasP5) return get('aug5'); // Augmented
        if (hasMaj3 && hasMin7) return get('b13_dom'); // V7b13
        return get('b6_min'); // Minor 6th
    }

    // 9: Major 6th / Diminished 7th / 13
    if (interval === 9) {
        if (hasMin3 && hasDim5 && !hasMin7 && !hasMaj7) return get('dim7'); // Dim7 bb7
        if (hasMin7) return get('maj13'); // 13 extension
        return get('maj6'); // 6th chord
    }

    // 10: Minor 7th / #13 (when Maj7 is present)
    if (interval === 10) {
        // If major 7th is already present, this is an augmented 13th, not a minor 7th
        if (hasMaj7) return get('sharp13');
        if (hasMaj3) return get('min7_dom'); // Dominant 7
        if (hasMin3) return get('min7_min'); // Minor 7
        return get('min7_gen'); // Generic
    }

    // 11: Major 7th
    if (interval === 11) {
        if (hasMin3) return get('dim_maj7'); // Min(Maj7)
        return get('maj7'); // Maj7
    }

    return get('unknown');
};


export interface ChordNotationSettings {
    major: 'maj' | '∆';
    minor: 'min' | 'm' | '-';
    diminished: 'dim' | '°' | 'dynamic';
    augmented: 'aug' | '+';
    halfDiminished: 'ø' | 'dynamic';
    omit: 'omit' | 'no';
    accidental: 'b' | '♭';
}

export const defaultChordNotation: ChordNotationSettings = {
    major: '∆',
    minor: '-',
    diminished: '°',
    augmented: '+',
    halfDiminished: 'ø',
    omit: 'omit',
    accidental: '♭'
};

export const formatChordName = (name: string, settings: ChordNotationSettings): string => {
    let formatted = name;

    // Apply Accidental Preference globally to input first (if input comes from not251 it might use 'b' or '♭')
    // not251 generally uses 'b' for flat in names like 'Eb' or 'min7b5'? Need to be careful.
    // Actually, let's substitute specific tokens.

    // Apply Accidental Preference globally to input first
    if (settings.accidental === '♭') {
        formatted = formatted.replace(/b/g, '♭');
        formatted = formatted.replace(/#/g, '♯');
    } else if (settings.accidental === 'b') {
        formatted = formatted.replace(/♭/g, 'b');
        formatted = formatted.replace(/♯/g, '#');
    }

    // Replace "maj" with user preference
    if (settings.major !== 'maj') {
        formatted = formatted.replace(/maj/g, settings.major);
    }

    // Minor Handling
    // If settings.minor is chosen, we replace standard minor tokens.
    // We do this BEFORE dynamic logic for complex chords, because dynamic logic uses settings.minor.

    // First, let's normalize the input string's minor representation if needed.
    // not251 often uses "-" or "min" or "m".
    // We want to replace all logic minor tokens with the chosen one.
    if (settings.minor !== '-') formatted = formatted.replace(/-/g, settings.minor);
    if (settings.minor !== 'min') formatted = formatted.replace(/min/g, settings.minor);
    // Note: replacing 'm' is dangerous if it's 'dim' or 'maj' or 'omit'. 
    // Usually 'm' appears as 'm7' or 'Cm'. 
    // Safest is to handle specific tokens usually.

    // Handle Augmented
    if (settings.augmented !== '+') {
        formatted = formatted.replace(/\+/g, settings.augmented);
    }
    if (settings.augmented !== 'aug') {
        formatted = formatted.replace(/aug/g, settings.augmented);
    }

    // Handle Diminished
    if (settings.diminished === 'dynamic') {
        // Construct replacement: Minor Symbol + Accidental + 5
        // e.g. "-b5" or "min♭5"
        const replacement = `${settings.minor}${settings.accidental}5`;
        formatted = formatted.replace(/dim/g, replacement);
        formatted = formatted.replace(/°/g, replacement);
    } else if (settings.diminished !== 'dim') {
        formatted = formatted.replace(/dim/g, settings.diminished);
    }

    // Handle Half-Diminished
    if (settings.halfDiminished === 'dynamic') {
        // Construct: Minor Symbol + 7 + Accidental + 5
        // e.g. "-7b5"
        const replacement = `${settings.minor}7${settings.accidental}5`;
        formatted = formatted.replace(/ø/g, replacement);
        // Also handle if the input was already "min7b5" style? 
        // If the input was "min7b5", the previous minor replacement might have handled the "min" part.
        // But we want to ensure the whole block is consistent.
        // It's tricky to replace existing "m7b5" with "ø" if user chose "ø".
        // But here we are in 'dynamic' mode, so we want the text.
    } else if (settings.halfDiminished !== 'ø') {
        formatted = formatted.replace(/ø/g, settings.halfDiminished);
    }

    // Handle Omit
    if (settings.omit !== 'omit') {
        formatted = formatted.replace(/omit/g, settings.omit);
    }

    return formatted;
};

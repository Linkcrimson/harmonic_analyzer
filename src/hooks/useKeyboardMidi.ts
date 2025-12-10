import { useEffect, useRef } from 'react';

// Mapping based on standard "tracker" style layout
// Z line for lower octave, Q/A line for upper octave usually, 
// but user specified: "a is do, s is re... black keys on w, e..."
// This corresponds to C4 starting at 'a'.

const KEY_TO_NOTE: Record<string, number> = {
    // White Keys
    'a': 0, // C
    's': 2, // D
    'd': 4, // E
    'f': 5, // F
    'g': 7, // G
    'h': 9, // A
    'j': 11, // B
    'k': 12, // C+1
    'l': 14, // D+1
    ';': 16, // E+1
    '\'': 17, // F+1

    // Black Keys
    'w': 1, // C#
    'e': 3, // D#
    't': 6, // F#
    'y': 8, // G#
    'u': 10, // A#
    'o': 13, // C#+1
    'p': 15, // D#+1
};

export const useKeyboardMidi = (
    onNoteOn: (note: number) => void,
    onNoteOff: (note: number) => void
) => {
    const pressedKeys = useRef<Set<string>>(new Set());

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;
            const key = e.key.toLowerCase();

            if (pressedKeys.current.has(key)) return;

            if (key in KEY_TO_NOTE) {
                // Prevent scrolling/typing if focusing UI
                if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

                pressedKeys.current.add(key);
                // Offset to C4 (MIDI 60) -> The app seems to use 0-based index relative to C4 (0 = C4) or C3?
                // Checking Piano.tsx: generatedKeys start at octave 0. 
                // In HarmonicContext, noteId 0 seems to be the first note.
                // onMidiNoteOnRef does `note - 60`. 
                // So if we pass 0 here, it matches the app's internal 0 (C4).
                onNoteOn(KEY_TO_NOTE[key]);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (pressedKeys.current.has(key)) {
                pressedKeys.current.delete(key);
                if (key in KEY_TO_NOTE) {
                    onNoteOff(KEY_TO_NOTE[key]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [onNoteOn, onNoteOff]);
};

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAudio, OscillatorType } from '../hooks/useAudio';
import { useMidi } from '../hooks/useMidi';
import { positionVector, inverse_select } from '../../not251/src/positionVector';
import { getChordName, scaleNames } from '../../not251/src/chord';

interface HarmonicState {
    activeNotes: Set<number>;
    currentWaveform: OscillatorType;
    chordName: string;
    chordOptions: any[];
    selectedOptionIndex: number;
    analysis: {
        rootName: string;
        quality: string;
        stability: string;
        function: string;
        extensions: string[];
        intervals: Map<number, string>; // noteId -> interval type (root, third, etc.)
        noteNames: Map<number, string>;
    };
    toggleNote: (noteId: number) => void;
    setWaveform: (type: OscillatorType) => void;
    playCurrentChord: () => void;
    reset: () => void;
    selectChordOption: (index: number) => void;
}

const HarmonicContext = createContext<HarmonicState | null>(null);

export const useHarmonic = () => {
    const context = useContext(HarmonicContext);
    if (!context) throw new Error("useHarmonic must be used within a HarmonicProvider");
    return context;
};

export const HarmonicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
    const [currentWaveform, setCurrentWaveform] = useState<OscillatorType>('sine');
    const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);

    // Analysis State
    const [chordOptions, setChordOptions] = useState<any[]>([]);
    const [analysis, setAnalysis] = useState<HarmonicState['analysis']>({
        rootName: '--',
        quality: '--',
        stability: '--',
        function: '--',
        extensions: [],
        intervals: new Map(),
        noteNames: new Map()
    });

    const { initAudio, playTone, getFrequency } = useAudio();

    // Analysis Logic (Ported from main.ts)
    const analyze = useCallback((notes: Set<number>, selectedIndex: number = 0) => {
        if (notes.size === 0) {
            setChordOptions([]);
            setAnalysis({
                rootName: '--',
                quality: '--',
                stability: '--',
                function: '--',
                extensions: [],
                intervals: new Map(),
                noteNames: new Map()
            });
            return;
        }

        const sortedNotes = Array.from(notes).sort((a, b) => a - b);
        const chordVec = new positionVector(sortedNotes, 12, 12).normalizeToModulo();

        // 1. Get Names
        let names: string[] = [];
        try {
            names = scaleNames(chordVec, true, false, true, true);
        } catch (e) {
            console.error(e);
        }

        const newNoteNames = new Map<number, string>();
        sortedNotes.forEach((noteId, index) => {
            if (names[index]) newNoteNames.set(noteId, names[index]);
        });

        // 2. Get Chord Options
        let options: any[] = [];
        try {
            const res = getChordName(chordVec, true);
            options = res.options;
        } catch (e) {
            console.error(e);
        }

        setChordOptions(options);

        // 3. Detailed Analysis based on selection
        if (options.length > 0 && options[selectedIndex]) {
            const selected = options[selectedIndex];
            const { root, components, detailedAnalysis, intervals: intervalTypes } = selected;

            // Recalculate names based on root for correct enharmonics
            // (Logic from updateAnalysisDisplay in main.ts)
            const rootIndex = inverse_select(root, chordVec).data[0];
            const rotatedVec = chordVec.rototranslate(rootIndex, chordVec.data.length, false);
            const rotatedNames = scaleNames(rotatedVec, true, false, true, false);

            // Update note names map with context-aware names
            const modulo = (n: number, m: number) => ((n % m) + m) % m;
            for (let i = 0; i < rotatedNames.length; i++) {
                const targetPitchClass = modulo(rotatedVec.data[i], 12);
                sortedNotes.forEach(noteId => {
                    if (modulo(noteId, 12) === targetPitchClass) {
                        if (rotatedNames[i]) newNoteNames.set(noteId, rotatedNames[i]);
                    }
                });
            }

            // Calculate Intervals Map for coloring
            const newIntervals = new Map<number, string>();
            const rootPitchClass = root.data[0];

            // Helper to map intervals
            const mapInterval = (semitones: number[], type: string) => {
                sortedNotes.forEach(noteId => {
                    const notePitchClass = modulo(noteId, 12);
                    const interval = modulo(notePitchClass - rootPitchClass, 12);
                    if (semitones.includes(interval)) newIntervals.set(noteId, type);
                });
            };

            // Default all to ext
            sortedNotes.forEach(n => newIntervals.set(n, 'ext'));

            // Apply specific colors
            mapInterval([0], 'root');

            const { thirdQuality, fifthQuality, seventhQuality } = detailedAnalysis;

            if (thirdQuality === "Maggiore") mapInterval([4], 'third');
            else if (thirdQuality === "Minore") mapInterval([3], 'third');
            else if (thirdQuality === "Sus 2") mapInterval([2], 'third');
            else if (thirdQuality === "Sus 4") mapInterval([5], 'third');

            if (fifthQuality === "Giusta") mapInterval([7], 'fifth');
            else if (fifthQuality === "Aumentata") mapInterval([8], 'fifth');
            else if (fifthQuality === "Diminuita") mapInterval([6], 'fifth');

            if (seventhQuality === "Mag 7") mapInterval([11], 'seventh');
            else if (seventhQuality === "Min 7") mapInterval([10], 'seventh');
            else if (seventhQuality === "Sesta/Dim") mapInterval([9], 'seventh');

            setAnalysis({
                rootName: components.rootName, // Or use newNoteNames.get(rootVal)
                quality: detailedAnalysis.thirdQuality,
                stability: detailedAnalysis.fifthQuality,
                function: detailedAnalysis.seventhQuality,
                extensions: detailedAnalysis.extensions,
                intervals: newIntervals,
                noteNames: newNoteNames
            });
        } else {
            // Fallback
            const fallbackIntervals = new Map<number, string>();
            sortedNotes.forEach(n => fallbackIntervals.set(n, 'active'));
            setAnalysis(prev => ({ ...prev, intervals: fallbackIntervals, noteNames: newNoteNames }));
        }

    }, []);

    // Re-analyze when activeNotes or selection changes
    useEffect(() => {
        analyze(activeNotes, selectedOptionIndex);
    }, [activeNotes, selectedOptionIndex, analyze]);


    const toggleNote = useCallback((noteId: number) => {
        initAudio(); // Ensure audio is unlocked
        setActiveNotes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(noteId)) {
                newSet.delete(noteId);
            } else {
                newSet.add(noteId);
                playTone(getFrequency(noteId), 0.4, currentWaveform, 0.8);
            }
            return newSet;
        });
        // Reset selection when notes change
        setSelectedOptionIndex(0);
    }, [currentWaveform, getFrequency, playTone, initAudio]);

    const playCurrentChord = useCallback(() => {
        if (activeNotes.size === 0) return;
        initAudio();
        const volPerNote = 0.4 / Math.max(1, activeNotes.size);
        const sortedNotes = Array.from(activeNotes).sort((a, b) => a - b);

        sortedNotes.forEach((noteId, index) => {
            const freq = getFrequency(noteId);
            const start = (index * 0.015); // Relative start time
            // We need absolute time for WebAudio, but playTone handles "startTime || ctx.currentTime"
            // To be precise, we should pass absolute time. 
            // For now, let's rely on playTone's internal "now". 
            // Actually, playTone takes startTime. We should pass ctx.currentTime + delay.
            // But we don't have ctx exposed here easily without refactoring useAudio to return ctx or currentTime.
            // Let's just use a timeout for simplicity or assume playTone handles it? 
            // useAudio's playTone: const start = startTime || ctx.currentTime;
            // So we can pass a delay if we change playTone signature or pass absolute time.
            // Let's update playTone to accept delay? Or just pass absolute time.
            // Since we don't have ctx here, we can't get currentTime.
            // Quick fix: use setTimeout? No, timing is bad.
            // Better: useAudio should expose `currentTime`.
            // OR: playTone takes `delay` instead of `startTime`.
            // Let's assume playTone handles it. 
            // Actually, I'll update useAudio to return `currentTime` getter or similar. 
            // OR simpler: just fire them all at once for now, or use setTimeout (micro-strum is 15ms, setTimeout is ok-ish).
            // Let's use setTimeout for the strum effect for now to avoid Context complexity.
            setTimeout(() => playTone(freq, 1.5, currentWaveform, volPerNote), index * 15);
        });
    }, [activeNotes, currentWaveform, getFrequency, playTone, initAudio]);

    const reset = useCallback(() => {
        setActiveNotes(new Set());
        setSelectedOptionIndex(0);
    }, []);

    const setWaveform = useCallback((type: OscillatorType) => {
        setCurrentWaveform(type);
    }, []);

    const selectChordOption = useCallback((index: number) => {
        setSelectedOptionIndex(index);
    }, []);

    // MIDI Integration
    const onMidiNoteOn = useCallback((note: number, velocity: number) => {
        const noteId = note - 60;
        setActiveNotes(prev => {
            const newSet = new Set(prev);
            if (!newSet.has(noteId)) {
                newSet.add(noteId);
                const vol = (velocity / 127) * 0.8;
                playTone(getFrequency(noteId), 0.4, currentWaveform, vol);
            }
            return newSet;
        });
        setSelectedOptionIndex(0);
    }, [currentWaveform, getFrequency, playTone]);

    const onMidiNoteOff = useCallback((note: number) => {
        const noteId = note - 60;
        setActiveNotes(prev => {
            const newSet = new Set(prev);
            newSet.delete(noteId);
            return newSet;
        });
        setSelectedOptionIndex(0);
    }, []);

    useMidi(onMidiNoteOn, onMidiNoteOff);

    return (
        <HarmonicContext.Provider value={{
            activeNotes,
            currentWaveform,
            chordName: chordOptions[selectedOptionIndex]?.chordName || '--',
            chordOptions,
            selectedOptionIndex,
            analysis,
            toggleNote,
            setWaveform,
            playCurrentChord,
            reset,
            selectChordOption
        }}>
            {children}
        </HarmonicContext.Provider>
    );
};

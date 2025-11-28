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
        flags: {
            isRootActive: boolean;
            isThirdActive: boolean;
            isFifthActive: boolean;
            isSeventhActive: boolean;
        };
    };
    toggleNote: (noteId: number) => void;
    setWaveform: (type: OscillatorType) => void;
    playCurrentChord: () => void;
    reset: () => void;
    selectChordOption: (index: number) => void;
    midiConnected: boolean;
    midiInputs: string[];
    sustainPedal: boolean;
    forceBassAsRoot: boolean;
    toggleBassAsRoot: () => void;
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
    const [forceBassAsRoot, setForceBassAsRoot] = useState(false);

    const toggleBassAsRoot = useCallback(() => {
        setForceBassAsRoot(prev => !prev);
    }, []);

    // Analysis State
    const [chordOptions, setChordOptions] = useState<any[]>([]);
    const [analysis, setAnalysis] = useState<HarmonicState['analysis']>({
        rootName: '--',
        quality: '--',
        stability: '--',
        function: '--',
        extensions: [],
        intervals: new Map(),
        noteNames: new Map(),
        flags: {
            isRootActive: false,
            isThirdActive: false,
            isFifthActive: false,
            isSeventhActive: false
        }
    });

    const { initAudio, startNote, stopNote, playTone, getFrequency } = useAudio();

    // Analysis Logic (Ported from main.ts)
    const analyze = useCallback((notes: Set<number>, selectedIndex: number = 0, bassAsRoot: boolean = false) => {
        if (notes.size === 0) {
            setChordOptions([]);
            setAnalysis({
                rootName: '--',
                quality: '--',
                stability: '--',
                function: '--',
                extensions: [],
                intervals: new Map(),
                noteNames: new Map(),
                flags: {
                    isRootActive: false,
                    isThirdActive: false,
                    isFifthActive: false,
                    isSeventhActive: false
                }
            });
            return;
        }

        const sortedNotes = Array.from(notes).sort((a, b) => a - b);
        const chordVec = new positionVector(sortedNotes, 12, 12).normalizeToModulo();

        // 1. Get Names (Initial fallback)
        let names: string[] = [];
        try {
            names = scaleNames(chordVec, true, false, true, false);
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
            const res = getChordName(chordVec, !bassAsRoot);
            options = res.options;
        } catch (e) {
            console.error(e);
        }

        setChordOptions(options);

        // 3. Detailed Analysis based on selection
        if (options.length > 0 && options[selectedIndex]) {
            const selected = options[selectedIndex];
            const { root, components, detailedAnalysis } = selected;

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

            const intervalValues = Array.from(newIntervals.values());

            setAnalysis({
                rootName: components.rootName,
                quality: detailedAnalysis.thirdQuality,
                stability: detailedAnalysis.fifthQuality,
                function: detailedAnalysis.seventhQuality,
                extensions: detailedAnalysis.extensions,
                intervals: newIntervals,
                noteNames: newNoteNames,
                flags: {
                    isRootActive: intervalValues.includes('root'),
                    isThirdActive: intervalValues.includes('third'),
                    isFifthActive: intervalValues.includes('fifth'),
                    isSeventhActive: intervalValues.includes('seventh')
                }
            });
        } else {
            // Fallback
            const fallbackIntervals = new Map<number, string>();
            sortedNotes.forEach(n => fallbackIntervals.set(n, 'active'));
            setAnalysis(prev => ({
                ...prev,
                intervals: fallbackIntervals,
                noteNames: newNoteNames,
                flags: {
                    isRootActive: false,
                    isThirdActive: false,
                    isFifthActive: false,
                    isSeventhActive: false
                }
            }));
        }

    }, []);

    // Re-analyze when activeNotes or selection changes
    useEffect(() => {
        analyze(activeNotes, selectedOptionIndex, forceBassAsRoot);
    }, [activeNotes, selectedOptionIndex, forceBassAsRoot, analyze]);


    // Helper to play a set of notes (fire and forget)
    const playChordNotes = useCallback((notes: Set<number>) => {
        if (notes.size === 0) return;
        initAudio();
        const volPerNote = 0.4 / Math.max(1, notes.size);
        const sortedNotes = Array.from(notes).sort((a, b) => a - b);

        sortedNotes.forEach((noteId, index) => {
            const freq = getFrequency(noteId);
            // Strum effect using playTone (fire and forget)
            setTimeout(() => playTone(freq, 1.5, currentWaveform, volPerNote), index * 30);
        });
    }, [currentWaveform, getFrequency, playTone, initAudio]);

    const toggleNote = useCallback((noteId: number) => {
        initAudio();
        const newSet = new Set(activeNotes);
        if (newSet.has(noteId)) {
            newSet.delete(noteId);
            stopNote(noteId);
        } else {
            newSet.add(noteId);
            playChordNotes(newSet);
        }
        setActiveNotes(newSet);
        setSelectedOptionIndex(0);
    }, [activeNotes, playChordNotes, stopNote, initAudio]);

    const playCurrentChord = useCallback(() => {
        playChordNotes(activeNotes);
    }, [activeNotes, playChordNotes]);

    const reset = useCallback(() => {
        activeNotes.forEach(noteId => stopNote(noteId));
        setActiveNotes(new Set());
        setSelectedOptionIndex(0);
    }, [activeNotes, stopNote]);

    const setWaveform = useCallback((type: OscillatorType) => {
        setCurrentWaveform(type);
    }, []);

    const selectChordOption = useCallback((index: number) => {
        setSelectedOptionIndex(index);
    }, []);

    // MIDI Integration
    const [sustainPedal, setSustainPedal] = useState(false);

    // Let's use Refs for the logic to avoid dependency hell and stale closures
    const heldNotesRef = React.useRef<Set<number>>(new Set());
    const sustainPedalRef = React.useRef(false);

    const onMidiNoteOnRef = useCallback((note: number, velocity: number) => {
        const noteId = note - 60;
        heldNotesRef.current.add(noteId);

        setActiveNotes(prev => {
            const newSet = new Set(prev);
            if (!newSet.has(noteId)) {
                newSet.add(noteId);
                const vol = (velocity / 127) * 0.8;
                startNote(noteId, getFrequency(noteId), currentWaveform, vol);
            }
            return newSet;
        });
        setSelectedOptionIndex(0);
    }, [currentWaveform, getFrequency, startNote]);

    const onMidiNoteOffRef = useCallback((note: number) => {
        const noteId = note - 60;
        heldNotesRef.current.delete(noteId);

        if (!sustainPedalRef.current) {
            setActiveNotes(prev => {
                const newSet = new Set(prev);
                if (newSet.has(noteId)) {
                    newSet.delete(noteId);
                    stopNote(noteId);
                }
                return newSet;
            });
            setSelectedOptionIndex(0);
        }
    }, [stopNote]);

    const onMidiControlChangeRef = useCallback((cc: number, value: number) => {
        if (cc === 64) {
            const isDown = value >= 64;
            sustainPedalRef.current = isDown;
            setSustainPedal(isDown); // Update state just in case we want to show it in UI

            if (!isDown) {
                // Pedal released: stop notes that are NOT held
                setActiveNotes(prevActive => {
                    const newActive = new Set(prevActive);
                    prevActive.forEach(noteId => {
                        if (!heldNotesRef.current.has(noteId)) {
                            newActive.delete(noteId);
                            stopNote(noteId);
                        }
                    });
                    return newActive;
                });
            }
        }
    }, [stopNote]);

    const { isConnected: midiConnected, inputs: midiInputs } = useMidi(onMidiNoteOnRef, onMidiNoteOffRef, onMidiControlChangeRef);

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
            selectChordOption,
            midiConnected,
            midiInputs,
            sustainPedal,
            forceBassAsRoot,
            toggleBassAsRoot
        }}>
            {children}
        </HarmonicContext.Provider>
    );
};

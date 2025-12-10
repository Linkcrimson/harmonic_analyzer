import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAudio, OscillatorType } from '../hooks/useAudio';
import { useMidi } from '../hooks/useMidi';
import { positionVector, inverse_select } from '../../not251/src/positionVector';
import { getChordName, scaleNames } from '../../not251/src/chord';
import { useKeyboardMidi } from '../hooks/useKeyboardMidi';

export const SMART_INPUT_LOCK_THRESHOLD_MS = 500;


export type InputMode = 'toggle' | 'momentary' | 'smart';
export type AudioMode = 'short' | 'continuous' | 'repeat';

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
        intervals: Map<number, string>;
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
    inputMode: InputMode;
    setInputMode: (mode: InputMode) => void;
    audioMode: AudioMode;
    setAudioMode: (mode: AudioMode) => void;
    startInput: (noteId: number, source?: 'ui' | 'midi') => void;
    stopInput: (noteId: number, source?: 'ui' | 'midi') => void;
    lockedNotes: Set<number>;
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
    const [inputMode, setInputMode] = useState<InputMode>('toggle');
    const [audioMode, setAudioMode] = useState<AudioMode>('short');
    const [lockedNotes, setLockedNotes] = useState<Set<number>>(new Set());
    const inputStartTimes = useRef<Map<number, number>>(new Map());
    const repeatIntervalRef = useRef<number | null>(null);

    const toggleBassAsRoot = useCallback(() => {
        setForceBassAsRoot(prev => !prev);
    }, []);

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

    const { initAudio, startNote, stopNote, playTone, getFrequency, setNoteVolume } = useAudio();


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

        let options: any[] = [];
        try {
            const res = getChordName(chordVec, !bassAsRoot);
            options = res.options;
        } catch (e) {
            console.error(e);
        }

        setChordOptions(options);

        if (options.length > 0 && options[selectedIndex]) {
            const selected = options[selectedIndex];
            const { root, components, detailedAnalysis } = selected;

            const rootIndex = inverse_select(root, chordVec).data[0];
            const rotatedVec = chordVec.rototranslate(rootIndex, chordVec.data.length, false);
            const rotatedNames = scaleNames(rotatedVec, true, false, true, false);

            const modulo = (n: number, m: number) => ((n % m) + m) % m;
            for (let i = 0; i < rotatedNames.length; i++) {
                const targetPitchClass = modulo(rotatedVec.data[i], 12);
                sortedNotes.forEach(noteId => {
                    if (modulo(noteId, 12) === targetPitchClass) {
                        if (rotatedNames[i]) newNoteNames.set(noteId, rotatedNames[i]);
                    }
                });
            }

            const newIntervals = new Map<number, string>();
            const rootPitchClass = root.data[0];

            const mapInterval = (semitones: number[], type: string) => {
                sortedNotes.forEach(noteId => {
                    const notePitchClass = modulo(noteId, 12);
                    const interval = modulo(notePitchClass - rootPitchClass, 12);
                    if (semitones.includes(interval)) newIntervals.set(noteId, type);
                });
            };

            sortedNotes.forEach(n => newIntervals.set(n, 'ext'));
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

    useEffect(() => {
        analyze(activeNotes, selectedOptionIndex, forceBassAsRoot);
    }, [activeNotes, selectedOptionIndex, forceBassAsRoot, analyze]);

    const playChordNotes = useCallback((notes: Set<number>) => {
        if (notes.size === 0) return;
        initAudio();
        const volPerNote = 0.4 / Math.max(1, notes.size);
        const sortedNotes = Array.from(notes).sort((a, b) => a - b);

        sortedNotes.forEach((noteId, index) => {
            const freq = getFrequency(noteId);
            setTimeout(() => playTone(freq, 1.5, currentWaveform, volPerNote), index * 30);
        });
    }, [currentWaveform, getFrequency, playTone, initAudio]);

    const toggleNote = useCallback((noteId: number) => {
        initAudio();
        const newSet = new Set(activeNotes);
        const isLocked = lockedNotes.has(noteId);

        if (newSet.has(noteId)) {
            if (isLocked) {
                setLockedNotes(prev => {
                    const u = new Set(prev);
                    u.delete(noteId);
                    return u;
                });
            }
            newSet.delete(noteId);
            stopNote(noteId);

            // Re-scale remaining notes
            if (audioMode === 'continuous') {
                const volPerNote = 0.4 / Math.max(1, newSet.size);
                newSet.forEach(id => setNoteVolume(id, volPerNote));
            }

        } else {
            newSet.add(noteId);
            if (audioMode === 'short' || audioMode === 'repeat') {
                playChordNotes(new Set([noteId]));
            } else {
                const volPerNote = 0.4 / Math.max(1, newSet.size);
                // Scale existing notes down
                newSet.forEach(id => {
                    if (id !== noteId) setNoteVolume(id, volPerNote);
                });
                startNote(noteId, getFrequency(noteId), currentWaveform, volPerNote);
            }
        }
        setActiveNotes(newSet);
        setSelectedOptionIndex(0);
    }, [activeNotes, lockedNotes, audioMode, playChordNotes, stopNote, startNote, getFrequency, currentWaveform, initAudio, setNoteVolume]);

    const startInput = useCallback((noteId: number, source: 'ui' | 'midi' = 'ui') => {
        initAudio();
        inputStartTimes.current.set(noteId, Date.now());

        const effectiveMode = source === 'midi' ? 'momentary' : inputMode;

        if (effectiveMode === 'toggle') {
            toggleNote(noteId);
        } else {
            setActiveNotes(prev => {
                const newSet = new Set(prev);
                newSet.add(noteId);

                if (audioMode === 'short' || audioMode === 'repeat') {
                    // For short/repeat in non-toggle input modes (like MIDI or momentary), we might spam this. 
                    // But playChordNotes handles a set. Here we just play ONE note? 
                    // Original code played set([noteId]).
                    playChordNotes(new Set([noteId]));
                } else {
                    const volPerNote = 0.4 / Math.max(1, newSet.size);
                    // Update others
                    prev.forEach(id => setNoteVolume(id, volPerNote));
                    // Start new
                    startNote(noteId, getFrequency(noteId), currentWaveform, volPerNote);
                }

                return newSet;
            });
        }
    }, [inputMode, audioMode, toggleNote, startNote, getFrequency, currentWaveform, initAudio, playChordNotes, setNoteVolume]);

    const stopInput = useCallback((noteId: number, source: 'ui' | 'midi' = 'ui') => {
        const startTime = inputStartTimes.current.get(noteId) || 0;
        const duration = Date.now() - startTime;
        inputStartTimes.current.delete(noteId);

        const effectiveMode = source === 'midi' ? 'momentary' : inputMode;

        if (effectiveMode === 'toggle') return;

        if (effectiveMode === 'momentary') {
            setActiveNotes(prev => {
                const newSet = new Set(prev);
                newSet.delete(noteId);

                if (audioMode === 'continuous') {
                    const volPerNote = 0.4 / Math.max(1, newSet.size);
                    newSet.forEach(id => setNoteVolume(id, volPerNote));
                }

                return newSet;
            });
            stopNote(noteId);
        } else if (effectiveMode === 'smart') {
            if (duration > SMART_INPUT_LOCK_THRESHOLD_MS) {
                setLockedNotes(prev => {

                    const newSet = new Set(prev);
                    newSet.add(noteId);
                    return newSet;
                });
            } else {
                if (lockedNotes.has(noteId)) {
                    setLockedNotes(prev => {
                        const u = new Set(prev);
                        u.delete(noteId);
                        return u;
                    });
                    setActiveNotes(prev => {
                        const u = new Set(prev);
                        u.delete(noteId);

                        // Rescale volume if note removed
                        if (audioMode === 'continuous') {
                            const volPerNote = 0.4 / Math.max(1, u.size);
                            u.forEach(id => setNoteVolume(id, volPerNote));
                        }

                        return u;
                    });
                    stopNote(noteId);
                } else {
                    setActiveNotes(prev => {
                        const u = new Set(prev);
                        u.delete(noteId);

                        // Rescale volume
                        if (audioMode === 'continuous') {
                            const volPerNote = 0.4 / Math.max(1, u.size);
                            u.forEach(id => setNoteVolume(id, volPerNote));
                        }

                        return u;
                    });
                    stopNote(noteId);
                }
            }
        }
    }, [inputMode, audioMode, stopNote, lockedNotes, setNoteVolume]);

    useEffect(() => {
        if (audioMode === 'repeat' && activeNotes.size > 0) {
            repeatIntervalRef.current = window.setInterval(() => {
                playChordNotes(activeNotes);
            }, 2000);
        }
        return () => {
            if (repeatIntervalRef.current) clearInterval(repeatIntervalRef.current);
        };
    }, [audioMode, activeNotes, playChordNotes]);

    useEffect(() => {
        if (activeNotes.size === 0) return;

        activeNotes.forEach(n => stopNote(n));

        if (audioMode === 'continuous') {
            const volPerNote = 0.4 / Math.max(1, activeNotes.size);
            activeNotes.forEach(n => {
                startNote(n, getFrequency(n), currentWaveform, volPerNote);
            });
        } else if (audioMode === 'short') {
            playChordNotes(activeNotes);
        } else if (audioMode === 'repeat') {
            playChordNotes(activeNotes);
        }
    }, [audioMode]);

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

    const [sustainPedal, setSustainPedal] = useState(false);
    const heldNotesRef = React.useRef<Set<number>>(new Set());
    const sustainPedalRef = React.useRef(false);

    const onMidiNoteOnRef = useCallback((note: number, _velocity: number) => {
        const noteId = note - 60;
        heldNotesRef.current.add(noteId);
        startInput(noteId, 'midi');
        setSelectedOptionIndex(0);
    }, [startInput]);

    const onMidiNoteOffRef = useCallback((note: number) => {
        const noteId = note - 60;
        heldNotesRef.current.delete(noteId);

        if (!sustainPedalRef.current) {
            stopInput(noteId, 'midi');
        }
    }, [stopInput]);

    const onMidiControlChangeRef = useCallback((cc: number, value: number) => {
        if (cc === 64) {
            const isDown = value >= 64;
            sustainPedalRef.current = isDown;
            setSustainPedal(isDown);

            if (!isDown) {
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

    // Enable PC Keyboard Support always
    // Map keyboard notes to 'ui' source to respect the selected inputMode (Smart/Toggle/Momentary)
    useKeyboardMidi(
        (noteId) => startInput(noteId, 'ui'),
        (noteId) => stopInput(noteId, 'ui')
    );

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
            toggleBassAsRoot,
            inputMode,
            setInputMode,
            audioMode,
            setAudioMode,
            startInput,
            stopInput,
            lockedNotes
        }}>
            {children}
        </HarmonicContext.Provider>
    );
};

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAudio, OscillatorType } from '../hooks/useAudio';
import { useMidi } from '../hooks/useMidi';
import { useKeyboardMidi } from '../hooks/useKeyboardMidi';
import { useNotation } from './NotationContext';
import { formatChordName } from '../utils/chordNotation';
import HarmonicWorker from '../workers/harmonicAnalysis.worker?worker';

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
    checkEnharmonic: boolean;
    toggleEnharmonic: () => void;
}

export const HarmonicContext = createContext<HarmonicState | null>(null);

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
    const [checkEnharmonic, setCheckEnharmonic] = useState(true);
    const inputStartTimes = useRef<Map<number, number>>(new Map());
    const repeatIntervalRef = useRef<number | null>(null);
    const { settings: notationSettings } = useNotation();

    const toggleEnharmonic = useCallback(() => {
        setCheckEnharmonic(prev => !prev);
    }, []);

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

    const { initAudio, startNote, stopNote, playTone, getFrequency, setNoteVolume, setNoteWaveform } = useAudio();
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        workerRef.current = new HarmonicWorker();
        workerRef.current.onmessage = (e) => {
            const { chordOptions, analysis } = e.data;
            setChordOptions(chordOptions);
            setAnalysis(analysis);
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    // [AUDIO LATENCY FIX] Global warm-up listener
    // Browsers suspend AudioContext until user interaction. 
    // By initializing on any click/touch, we prevent the delay when the first note is played.
    useEffect(() => {
        const warmUp = () => {
            initAudio();
            window.removeEventListener('click', warmUp);
            window.removeEventListener('touchstart', warmUp);
        };
        window.addEventListener('click', warmUp);
        window.addEventListener('touchstart', warmUp);
        return () => {
            window.removeEventListener('click', warmUp);
            window.removeEventListener('touchstart', warmUp);
        };
    }, [initAudio]);

    const analyze = useCallback((notes: Set<number>, selectedIndex: number = 0, bassAsRoot: boolean = false, useEnharmonic: boolean = true) => {
        if (!workerRef.current) return;

        const sortedNotes = Array.from(notes).sort((a, b) => a - b);
        workerRef.current.postMessage({
            activeNotes: sortedNotes,
            selectedIndex,
            bassAsRoot,
            useEnharmonic
        });
    }, []);

    useEffect(() => {
        analyze(activeNotes, selectedOptionIndex, forceBassAsRoot, checkEnharmonic);
    }, [activeNotes, selectedOptionIndex, forceBassAsRoot, analyze, checkEnharmonic]);

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
                // Play full chord instead of single note
                playChordNotes(newSet);
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
                    // Play full chord instead of just the triggered note
                    playChordNotes(newSet);
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
        // Reactive update for active oscillators
        activeNotes.forEach(noteId => {
            setNoteWaveform(noteId, type);
        });
    }, [activeNotes, setNoteWaveform]);

    const selectChordOption = useCallback((index: number) => {
        setSelectedOptionIndex(index);
    }, []);

    const [sustainPedal, setSustainPedal] = useState(false);
    const heldNotesRef = React.useRef<Set<number>>(new Set());
    const sustainPedalRef = React.useRef(false);
    const notesPendingOffRef = React.useRef<Set<number>>(new Set());

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
        } else {
            // Buffer the note off if sustain is active
            notesPendingOffRef.current.add(noteId);
        }
    }, [stopInput]);

    const onMidiControlChangeRef = useCallback((cc: number, value: number) => {
        if (cc === 64) {
            const isDown = value >= 64;
            sustainPedalRef.current = isDown;
            setSustainPedal(isDown);

            if (!isDown) {
                // Release all notes that received a physical Note Off during sustain
                notesPendingOffRef.current.forEach(noteId => {
                    stopInput(noteId, 'midi');
                });
                notesPendingOffRef.current.clear();
            }
        }
    }, [stopInput]);

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
            chordName: formatChordName(chordOptions[selectedOptionIndex]?.chordName || '--', notationSettings),
            chordOptions: chordOptions.map(opt => ({
                ...opt,
                chordName: formatChordName(opt.chordName, notationSettings)
            })),
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
            lockedNotes,
            checkEnharmonic,
            toggleEnharmonic
        }}>
            {children}
        </HarmonicContext.Provider>
    );
};

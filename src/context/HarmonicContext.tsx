import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { OscillatorType } from '../audio/SynthVoice';
import { audioEngine } from '../audio/AudioEngine';
import { arpEngine, ArpPattern, ArpSortMode } from '../audio/ArpeggiatorEngine';
import { useMidi } from '../hooks/useMidi';
import { useKeyboardMidi } from '../hooks/useKeyboardMidi';
import { useNotation } from './NotationContext';
import { formatChordName } from '../utils/chordNotation';
import HarmonicWorker from '../workers/harmonicAnalysis.worker?worker';

export const SMART_INPUT_LOCK_THRESHOLD_MS = 500;


export type InputMode = 'toggle' | 'momentary' | 'smart';
export type AudioMode = 'short' | 'continuous' | 'repeat' | 'arpeggio';

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
    bpm: number;
    setBpm: (bpm: number) => void;
    arpPattern: ArpPattern;
    setArpPattern: (pattern: ArpPattern) => void;
    arpSortMode: ArpSortMode;
    setArpSortMode: (mode: ArpSortMode) => void;
    arpDivision: number;
    setArpDivision: (div: number) => void;
    arpOctaves: number;
    setArpOctaves: (oct: number) => void;
    masterVolume: number;
    setMasterVolume: (vol: number) => void;
    shortDuration: number;
    setShortDuration: (dur: number) => void;
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
    const [bpm, setBpm] = useState(120);
    const [arpPattern, setArpPattern] = useState<ArpPattern>('up');
    const [arpSortMode, setArpSortMode] = useState<ArpSortMode>('pitch');
    const [arpDivision, setArpDivision] = useState(1 / 8);
    const [arpOctaves, setArpOctaves] = useState(1);
    const [masterVolume, setMasterVolumeState] = useState(0.5);
    const [shortDuration, setShortDuration] = useState(0.3);
    const [isManuallyStopped, setIsManuallyStopped] = useState(false);
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

    // const { initAudio, startNote, stopNote, playTone, getFrequency, setNoteVolume, setNoteWaveform } = useAudio();
    // Replaced by AudioEngine
    const workerRef = useRef<Worker | null>(null);

    const requestIdRef = useRef<number>(0);

    useEffect(() => {
        workerRef.current = new HarmonicWorker();
        workerRef.current.onmessage = (e) => {
            const { chordOptions, analysis, requestId } = e.data;
            if (requestId === requestIdRef.current) {
                // Reconstitute Maps from serialized arrays
                analysis.intervals = new Map(analysis.intervals as any);
                analysis.noteNames = new Map(analysis.noteNames as any);

                setChordOptions(chordOptions);
                setAnalysis(analysis);
            }
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
            audioEngine.resume();
            window.removeEventListener('click', warmUp);
            window.removeEventListener('touchstart', warmUp);
        };
        window.addEventListener('click', warmUp);
        window.addEventListener('touchstart', warmUp);
        return () => {
            window.removeEventListener('click', warmUp);
            window.removeEventListener('touchstart', warmUp);
        };
    }, []);

    const analyze = useCallback((notes: Set<number>, selectedIndex: number = 0, bassAsRoot: boolean = false, useEnharmonic: boolean = true) => {
        if (!workerRef.current) return;

        const sortedNotes = Array.from(notes).sort((a, b) => a - b);
        const newRequestId = requestIdRef.current + 1;
        requestIdRef.current = newRequestId;

        workerRef.current.postMessage({
            activeNotes: sortedNotes,
            selectedIndex,
            bassAsRoot,
            useEnharmonic,
            requestId: newRequestId
        });
    }, []);

    useEffect(() => {
        analyze(activeNotes, selectedOptionIndex, forceBassAsRoot, checkEnharmonic);
    }, [activeNotes, selectedOptionIndex, forceBassAsRoot, analyze, checkEnharmonic]);

    const playChordNotes = useCallback((notes: Set<number>) => {
        if (notes.size === 0) return;

        const sortedNotes = Array.from(notes).sort((a, b) => a - b);
        const frequencies = sortedNotes.map(n => audioEngine.getFrequency(n));

        if (audioMode === 'arpeggio') {
            arpEngine.start(sortedNotes);
        } else {
            // Use the new precise scheduling engine
            // Duration controlled by shortDuration state (default 0.3s)
            audioEngine.playStrum(sortedNotes, frequencies, currentWaveform, shortDuration, 'simultaneous', 0);
        }

    }, [currentWaveform, audioMode]);

    const toggleNote = useCallback((noteId: number) => {
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
            audioEngine.noteOff(noteId);

            // Re-scale remaining notes - NOT NEEDED with AudioEngine (handled by Master/Compressor usually, but we can add logic if needed)
            // AudioEngine manages individual voice gain. For now we skip dynamic volume rescaling per note
            // as it complicates the engine unnecessarily for this phase. The compressor handles aggregate levels.

        } else {
            newSet.add(noteId);
            if (audioMode === 'short' || audioMode === 'repeat' || audioMode === 'arpeggio') {
                // Play full chord or start arp
                playChordNotes(newSet);
            } else {
                // Continuous mode
                audioEngine.noteOn(noteId, audioEngine.getFrequency(noteId), currentWaveform, 0.5);
            }
        }
        setIsManuallyStopped(false);
        setActiveNotes(newSet);
        setSelectedOptionIndex(0);
    }, [activeNotes, lockedNotes, audioMode, playChordNotes, currentWaveform]);

    const startInput = useCallback((noteId: number, source: 'ui' | 'midi' = 'ui') => {
        inputStartTimes.current.set(noteId, Date.now());

        const effectiveMode = source === 'midi' ? 'momentary' : inputMode;

        if (effectiveMode === 'toggle') {
            toggleNote(noteId);
        } else {
            setActiveNotes(prev => {
                const newSet = new Set(prev);
                newSet.add(noteId);

                if (audioMode === 'short' || audioMode === 'repeat' || audioMode === 'arpeggio') {
                    // Play full chord or start arp
                    playChordNotes(newSet);
                } else {
                    audioEngine.noteOn(noteId, audioEngine.getFrequency(noteId), currentWaveform, 0.5);
                }

                return newSet;
            });
        }
        setIsManuallyStopped(false);
    }, [inputMode, audioMode, toggleNote, currentWaveform, playChordNotes]);

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
                // Volume rescaling skipped
                return newSet;
            });
            audioEngine.noteOff(noteId);
            if (audioMode === 'arpeggio') {
                // Update arp engine with remaining notes
                setActiveNotes(prev => {
                    arpEngine.updateNotes(Array.from(prev));
                    return prev;
                });
            }
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
                        return u;
                    });
                    audioEngine.noteOff(noteId);
                } else {
                    setActiveNotes(prev => {
                        const u = new Set(prev);
                        u.delete(noteId);
                        return u;
                    });
                    audioEngine.noteOff(noteId);
                }
            }
        }
    }, [inputMode, audioMode, lockedNotes]);

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
        if (activeNotes.size === 0) {
            // Stop all if empty? Or just let noteOff handle it. 
            // Ideally we want to stop any lingering voices if set is cleared abruptly
            if (activeNotes.size === 0) audioEngine.stopAll();
            return;
        }

        if (audioMode === 'continuous') {
            // Ensure all active notes are playing
            activeNotes.forEach(n => {
                audioEngine.noteOn(n, audioEngine.getFrequency(n), currentWaveform, 0.5);
            });
        } else if (audioMode === 'short' || audioMode === 'repeat' || audioMode === 'arpeggio') {
            playChordNotes(activeNotes);
        }

        // Handle stop
        if (audioMode !== 'arpeggio') {
            arpEngine.stop();
        }
    }, [audioMode]);

    // Update Arp Engine config whenever state changes
    useEffect(() => {
        arpEngine.setConfig({
            bpm,
            pattern: arpPattern,
            sortMode: arpSortMode,
            division: arpDivision,
            octaves: arpOctaves,
            waveform: currentWaveform,
            intervals: analysis.intervals
        });
    }, [bpm, arpPattern, arpSortMode, arpDivision, arpOctaves, currentWaveform, analysis.intervals]);

    // Synchronize Arp notes when activeNotes changes
    useEffect(() => {
        if (audioMode === 'arpeggio') {
            arpEngine.updateNotes(Array.from(activeNotes));
        }
    }, [activeNotes, audioMode]);

    const playCurrentChord = useCallback(() => {
        playChordNotes(activeNotes);
    }, [activeNotes, playChordNotes]);

    const togglePlayback = useCallback(() => {
        if (!isManuallyStopped && (activeNotes.size > 0)) {
            // Stop
            audioEngine.stopAll();
            arpEngine.stop();
            if (repeatIntervalRef.current) {
                clearInterval(repeatIntervalRef.current);
                repeatIntervalRef.current = null;
            }
            setIsManuallyStopped(true);
        } else if (activeNotes.size > 0) {
            // Resume
            setIsManuallyStopped(false);
            if (audioMode === 'continuous') {
                activeNotes.forEach(n => {
                    audioEngine.noteOn(n, audioEngine.getFrequency(n), currentWaveform, 0.5);
                });
            } else {
                playChordNotes(activeNotes);
            }
        }
    }, [isManuallyStopped, activeNotes, audioMode, currentWaveform, playChordNotes]);

    const reset = useCallback(() => {
        activeNotes.forEach(noteId => audioEngine.noteOff(noteId));
        arpEngine.stop();
        setActiveNotes(new Set());
        setSelectedOptionIndex(0);
        setIsManuallyStopped(false);
    }, [activeNotes]);

    const setWaveform = useCallback((type: OscillatorType) => {
        setCurrentWaveform(type);
        audioEngine.setGlobalWaveform(type);
    }, []);

    const selectChordOption = useCallback((index: number) => {
        setSelectedOptionIndex(index);
    }, []);

    const setMasterVolume = useCallback((vol: number) => {
        setMasterVolumeState(vol);
        audioEngine.setMasterVolume(vol);
    }, []);

    const [sustainPedal, setSustainPedal] = useState(false);
    const heldNotesRef = useRef<Set<number>>(new Set());
    const sustainPedalRef = useRef(false);
    const notesPendingOffRef = useRef<Set<number>>(new Set());

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
        (noteId) => stopInput(noteId, 'ui'),
        togglePlayback
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
            toggleEnharmonic,
            bpm,
            setBpm,
            arpPattern,
            setArpPattern,
            arpSortMode,
            setArpSortMode,
            arpDivision,
            setArpDivision,
            arpOctaves,
            setArpOctaves,
            masterVolume,
            setMasterVolume,
            shortDuration,
            setShortDuration
        }}>
            {children}
        </HarmonicContext.Provider>
    );
};

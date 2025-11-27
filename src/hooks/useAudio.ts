import { useRef, useCallback } from 'react';

export type OscillatorType = 'sine' | 'triangle' | 'square' | 'sawtooth';

interface ActiveNote {
    osc: OscillatorNode;
    gain: GainNode;
}

export const useAudio = () => {
    const audioCtxRef = useRef<AudioContext | null>(null);
    const masterGainRef = useRef<GainNode | null>(null);
    const compressorRef = useRef<DynamicsCompressorNode | null>(null);
    const activeOscillators = useRef<Map<number, ActiveNote>>(new Map());

    const initAudio = useCallback(() => {
        if (!audioCtxRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();

            const masterGain = ctx.createGain();
            const compressor = ctx.createDynamicsCompressor();

            // Compressor settings
            compressor.threshold.value = -12;
            compressor.knee.value = 30;
            compressor.ratio.value = 3;
            compressor.attack.value = 0.003;
            compressor.release.value = 0.25;

            // Effects: Delay
            const delayNode = ctx.createDelay();
            const feedbackGain = ctx.createGain();
            const wetGain = ctx.createGain();

            delayNode.delayTime.value = 0.3; // 300ms delay
            feedbackGain.gain.value = 0.4; // 40% feedback
            wetGain.gain.value = 0.3; // 30% wet mix

            // Connect chain
            // Source (Compressor) -> MasterGain -> Destination (Dry)
            compressor.connect(masterGain);
            masterGain.connect(ctx.destination);

            // Effect Send: MasterGain -> Delay -> WetGain -> Destination
            masterGain.connect(delayNode);
            delayNode.connect(wetGain);
            wetGain.connect(ctx.destination);

            // Feedback Loop: Delay -> Feedback -> Delay
            delayNode.connect(feedbackGain);
            feedbackGain.connect(delayNode);

            masterGain.gain.value = 0.8; // Reduced master volume to prevent clipping with polyphony

            audioCtxRef.current = ctx;
            masterGainRef.current = masterGain;
            compressorRef.current = compressor;
        }

        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    }, []);

    const startNote = useCallback((noteId: number, freq: number, type: OscillatorType = 'sine', volume = 1.0) => {
        initAudio();
        const ctx = audioCtxRef.current!;

        // Stop existing note if any (monophonic per key)
        if (activeOscillators.current.has(noteId)) {
            stopNote(noteId);
        }

        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        // Dual Oscillator for richer sound (Detuned)
        // For now, let's stick to single but prepare for upgrade or just add a second one here?
        // Let's keep it simple first, but apply ADSR.

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // ADSR Envelope
        const now = ctx.currentTime;
        const attack = 0.02;
        const decay = 0.1;
        const sustain = 0.7;
        // Release is handled in stopNote

        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(volume, now + attack);
        noteGain.gain.linearRampToValueAtTime(volume * sustain, now + attack + decay);

        osc.connect(noteGain);
        noteGain.connect(compressorRef.current!);

        osc.start(now);

        activeOscillators.current.set(noteId, { osc, gain: noteGain });
    }, [initAudio]);

    const stopNote = useCallback((noteId: number) => {
        const activeNote = activeOscillators.current.get(noteId);
        if (activeNote && audioCtxRef.current) {
            const { osc, gain } = activeNote;
            const ctx = audioCtxRef.current;
            const now = ctx.currentTime;
            const release = 0.3;

            // Release phase
            gain.gain.cancelScheduledValues(now);
            gain.gain.setValueAtTime(gain.gain.value, now); // Anchor current value
            gain.gain.exponentialRampToValueAtTime(0.001, now + release);

            osc.stop(now + release);

            // Cleanup map after release
            setTimeout(() => {
                if (activeOscillators.current.get(noteId) === activeNote) {
                    activeOscillators.current.delete(noteId);
                }
            }, release * 1000 + 50);
        }
    }, []);

    // Legacy support / Fire-and-forget (e.g. for strumming)
    const playTone = useCallback((freq: number, duration = 0.5, type: OscillatorType = 'sine', volume = 1.0) => {
        // We can implement this using start/stop or keep it separate.
        // Keeping it separate avoids polluting the activeOscillators map with temporary notes 
        // that we don't intend to manually stop.
        initAudio();
        const ctx = audioCtxRef.current!;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(volume, now + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(noteGain);
        noteGain.connect(compressorRef.current!);

        osc.start(now);
        osc.stop(now + duration);
    }, [initAudio]);

    const getFrequency = useCallback((noteId: number) => {
        const midiNote = 60 + noteId;
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }, []);

    return { initAudio, startNote, stopNote, playTone, getFrequency };
};

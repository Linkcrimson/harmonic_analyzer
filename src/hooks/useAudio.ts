import { useRef, useCallback, useEffect } from 'react';

export type OscillatorType = 'sine' | 'triangle' | 'square' | 'sawtooth';

export const useAudio = () => {
    const audioCtxRef = useRef<AudioContext | null>(null);
    const masterGainRef = useRef<GainNode | null>(null);
    const compressorRef = useRef<DynamicsCompressorNode | null>(null);

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

            // Connect chain
            compressor.connect(masterGain);
            masterGain.connect(ctx.destination);
            masterGain.gain.value = 1.5;

            audioCtxRef.current = ctx;
            masterGainRef.current = masterGain;
            compressorRef.current = compressor;
        }

        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    }, []);

    const playTone = useCallback((freq: number, duration = 0.5, type: OscillatorType = 'sine', volume = 1.0, startTime?: number) => {
        initAudio();
        const ctx = audioCtxRef.current!;
        const start = startTime || ctx.currentTime;

        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);

        // Envelope
        noteGain.gain.setValueAtTime(0, start);
        noteGain.gain.linearRampToValueAtTime(volume, start + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.connect(noteGain);
        noteGain.connect(compressorRef.current!);

        osc.start(start);
        osc.stop(start + duration);
    }, [initAudio]);

    const getFrequency = useCallback((noteId: number) => {
        // Mapping: noteId 0 = C3 (MIDI 60 - wait, main.ts said noteId 0 = C3 (MIDI 48)? Let's check main.ts)
        // main.ts: const midiNote = 60 + noteId; -> So noteId 0 is Middle C (C4) if 60 is C4. 
        // Actually main.ts comment says: "Mapping: noteId 0 = C3 (MIDI 48)" but code says `60 + noteId`.
        // Standard MIDI: 60 is C4. 
        // Let's stick to the code: 60 + noteId.
        const midiNote = 60 + noteId;
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }, []);

    return { initAudio, playTone, getFrequency };
};

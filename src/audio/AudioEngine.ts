import { SynthVoice, OscillatorType } from './SynthVoice';

export class AudioEngine {
    private ctx: AudioContext;
    private masterGain: GainNode;
    private compressor: DynamicsCompressorNode;
    private voices: SynthVoice[] = [];
    private maxVoices: number = 16;
    private activeNotesMap: Map<number, SynthVoice> = new Map(); // Fast lookup noteId -> Voice

    // Listeners for Visual Feedback
    private noteOnListeners = new Set<(noteId: number) => void>();
    private noteOffListeners = new Set<(noteId: number) => void>();

    public subscribe(event: 'noteOn' | 'noteOff', callback: (noteId: number) => void) {
        if (event === 'noteOn') this.noteOnListeners.add(callback);
        else this.noteOffListeners.add(callback);
    }

    public unsubscribe(event: 'noteOn' | 'noteOff', callback: (noteId: number) => void) {
        if (event === 'noteOn') this.noteOnListeners.delete(callback);
        else this.noteOffListeners.delete(callback);
    }

    constructor() {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();

        // Master Chain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5; // Warning: 16 voices can be loud

        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -12;
        this.compressor.ratio.value = 3;

        // Routing: Voices -> Compressor -> Master -> Destination
        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        // Initialize Voice Pool
        for (let i = 0; i < this.maxVoices; i++) {
            this.voices.push(new SynthVoice(this.ctx, this.compressor));
        }
    }

    public resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public get currentTime() {
        return this.ctx.currentTime;
    }

    public setMasterVolume(val: number) {
        this.masterGain.gain.setValueAtTime(val, this.ctx.currentTime);
    }

    public setGlobalWaveform(type: OscillatorType) {
        this.voices.forEach(v => v.setType(type));
    }

    private getVoice(activationTime: number): SynthVoice {
        // 1. Find free voice
        let voice = this.voices.find(v => !v.isBusy);

        // 2. Steal voice if necessary (LRU - Oldest timestamp)
        if (!voice) {
            voice = this.voices.reduce((prev, curr) => (prev.timestamp < curr.timestamp ? prev : curr));
            voice.forceStop();
            // Remove from activeNotesMap if it was stolen
            for (const [noteId, activeVoice] of this.activeNotesMap.entries()) {
                if (activeVoice === voice) {
                    this.activeNotesMap.delete(noteId);
                    // Schedule feedback for the stolen note
                    this.scheduleFeedback(noteId, activationTime, 'off');
                    break;
                }
            }
        }
        return voice;
    }

    public noteOn(noteId: number, freq: number, type: OscillatorType = 'sine', volume: number = 0.5, time?: number) {
        this.resume();
        const now = this.ctx.currentTime;
        const activationTime = time || now;

        // 1. Check if note is already playing (retrigger?)
        if (this.activeNotesMap.has(noteId)) {
            const voice = this.activeNotesMap.get(noteId)!;
            voice.triggerAttack(noteId, freq, activationTime, type, volume);
            this.scheduleFeedback(noteId, activationTime, 'on'); // Still schedule feedback for retrigger
            return;
        }

        const voice = this.getVoice(activationTime);
        voice.setType(type);
        voice.triggerAttack(noteId, freq, activationTime, type, volume);
        this.activeNotesMap.set(noteId, voice);

        // Schedule visual feedback
        this.scheduleFeedback(noteId, activationTime, 'on');
    }

    public noteOff(noteId: number, time?: number) {
        const now = this.ctx.currentTime;
        const releaseTime = time || now;

        const voice = this.activeNotesMap.get(noteId);
        if (voice) {
            voice.triggerRelease(releaseTime);
            this.activeNotesMap.delete(noteId);
            // Schedule visual feedback
            this.scheduleFeedback(noteId, releaseTime, 'off');
        }
    }

    public stopAll() {
        const now = this.ctx.currentTime;
        this.voices.forEach(v => {
            if (v.isBusy) {
                v.triggerRelease(now);
                // Schedule feedback for all stopped notes
                if (v.noteId !== null) {
                    this.scheduleFeedback(v.noteId, now, 'off');
                }
            }
        });
        this.activeNotesMap.clear();
    }

    // Schedule a chord/strum
    // pattern: 'simultaneous' | 'up' | 'down'
    public playStrum(notes: number[], frequencies: number[], type: OscillatorType, duration: number, pattern: 'simultaneous' | 'up' | 'down' = 'simultaneous', gap: number = 0.05) {
        this.resume();
        const now = this.ctx.currentTime + 0.05; // lookahead increased to 50ms
        const volPerNote = 0.6 / Math.max(1, notes.length);

        notes.forEach((noteId, index) => {
            let startTime = now;
            if (pattern === 'up') startTime += index * gap;
            if (pattern === 'down') startTime += (notes.length - 1 - index) * gap;

            const voice = this.getVoice(startTime);
            voice.setType(type);
            voice.triggerAttack(noteId, frequencies[index], startTime, type, volPerNote);
            this.activeNotesMap.set(noteId, voice); // Add to active notes map

            this.scheduleFeedback(noteId, startTime, 'on');

            // Auto release after duration (if acting as a one-shot playback)
            const releaseTime = startTime + duration;
            this.noteOff(noteId, releaseTime); // This handles release logic + release feedback
        });
    }

    private scheduleFeedback(noteId: number, audioTime: number, type: 'on' | 'off') {
        const delayMs = (audioTime - this.ctx.currentTime) * 1000;
        const trigger = () => {
            if (type === 'on') {
                this.noteOnListeners.forEach(cb => cb(noteId));
            } else {
                this.noteOffListeners.forEach(cb => cb(noteId));
            }
        };

        if (delayMs <= 0) {
            trigger();
        } else {
            setTimeout(trigger, delayMs);
        }
    }

    public getFrequency(noteId: number) {
        const midiNote = 60 + noteId;
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }
}

export const audioEngine = new AudioEngine();

import { audioEngine } from './AudioEngine';
import { OscillatorType } from './SynthVoice';

export type ArpPattern = 'up' | 'down' | 'updown' | 'random';
export type ArpSortMode = 'pitch' | 'harmonic';

export class ArpeggiatorEngine {
    private bpm: number = 120;
    private pattern: ArpPattern = 'up';
    private sortMode: ArpSortMode = 'pitch';
    private division: number = 1 / 8; // 8th notes
    private octaves: number = 1;
    private rootPitch: number = 0;
    private active: boolean = false;

    private notes: number[] = [];
    private baseNotes: number[] = []; // Store original notes to re-calculate on octave change
    private currentIndex: number = 0;
    private nextNoteTime: number = 0;
    private timerId: number | null = null;
    private direction: 1 | -1 = 1;

    private waveform: OscillatorType = 'sine';

    public setConfig(config: { bpm?: number, pattern?: ArpPattern, sortMode?: ArpSortMode, division?: number, octaves?: number, waveform?: OscillatorType, rootPitch?: number }) {
        let regenerate = false;
        if (config.bpm) this.bpm = config.bpm;
        if (config.pattern) {
            if (this.pattern !== config.pattern) regenerate = true;
            this.pattern = config.pattern;
        }
        if (config.sortMode && this.sortMode !== config.sortMode) {
            this.sortMode = config.sortMode;
            regenerate = true;
        }
        if (config.division) this.division = config.division;
        if (config.octaves && config.octaves !== this.octaves) {
            this.octaves = config.octaves;
            regenerate = true;
        }
        if (config.waveform) this.waveform = config.waveform;
        if (config.rootPitch !== undefined && config.rootPitch !== this.rootPitch) {
            this.rootPitch = config.rootPitch;
            if (this.sortMode === 'harmonic') regenerate = true;
        }

        if (regenerate && this.baseNotes.length > 0) {
            this.generateNotes();
        }
    }

    private generateNotes() {
        if (this.baseNotes.length === 0) {
            this.notes = [];
            return;
        }

        const uniqueNotes = [...new Set(this.baseNotes)];

        if (this.sortMode === 'harmonic') {
            // Sort by Harmonic Function (Interval from Root: Root, b2, 2, ..., 7)
            uniqueNotes.sort((a, b) => {
                // Calculate interval from root (0-11)
                const intervalA = (a - this.rootPitch + 1200) % 12;
                const intervalB = (b - this.rootPitch + 1200) % 12;

                // Primary sort: Interval (Root < 3rd < 5th < 7th)
                if (intervalA !== intervalB) return intervalA - intervalB;

                // Secondary sort: Pitch (Low to High)
                return a - b;
            });
        } else {
            // Default: Pitch ascending
            uniqueNotes.sort((a, b) => a - b);
        }

        let expanded: number[] = [];
        for (let i = 0; i < this.octaves; i++) {
            expanded.push(...uniqueNotes.map(n => n + (i * 12)));
        }
        this.notes = expanded;

        if (this.pattern === 'down') {
            this.notes.reverse();
        }
    }

    public start(notes: number[]) {
        if (notes.length === 0) {
            this.stop();
            return;
        }

        this.baseNotes = [...notes];
        this.generateNotes();

        if (this.active) return; // Already running

        this.active = true;
        this.currentIndex = 0;
        this.nextNoteTime = audioEngine.currentTime;
        this.scheduler();
    }

    public updateNotes(notes: number[]) {
        this.baseNotes = [...notes];
        this.generateNotes();

        if (this.baseNotes.length === 0 && this.active) {
            this.stop();
        } else if (this.baseNotes.length > 0 && !this.active) {
            // Should be started by the context usually
        }
    }

    public stop() {
        this.active = false;
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }

    private scheduler() {
        if (!this.active) return;

        // Schedule notes while nextNoteTime is within 100ms lookahead
        while (this.nextNoteTime < audioEngine.currentTime + 0.1) {
            this.scheduleNote(this.currentIndex, this.nextNoteTime);
            this.advanceNote();
        }

        // Check back in 25ms
        this.timerId = window.setTimeout(() => this.scheduler(), 25);
    }

    private scheduleNote(index: number, time: number) {
        if (this.notes.length === 0) return;

        let noteId = this.notes[index % this.notes.length];

        // Pattern logic
        if (this.pattern === 'random') {
            noteId = this.notes[Math.floor(Math.random() * this.notes.length)];
        }

        const freq = audioEngine.getFrequency(noteId);
        const duration = (60 / this.bpm) * this.division * 0.8; // 80% duty cycle

        // Single shot NoteOn/NoteOff at 'time'
        audioEngine.noteOn(noteId, freq, this.waveform, 0.4, time);
        audioEngine.noteOff(noteId, time + duration);
    }

    private advanceNote() {
        const secondsPerBeat = 60.0 / this.bpm;
        // Simplified division: 1/4 = 1 beat, 1/8 = 0.5 beat
        this.nextNoteTime += secondsPerBeat * (this.division * 4);

        if (this.pattern === 'updown') {
            if (this.notes.length <= 1) {
                this.currentIndex = 0;
                return;
            }
            this.currentIndex += this.direction;

            if (this.currentIndex >= this.notes.length - 1) {
                this.currentIndex = this.notes.length - 1;
                this.direction = -1;
            } else if (this.currentIndex <= 0) {
                this.currentIndex = 0;
                this.direction = 1;
            }
        } else if (this.pattern === 'down') {
            this.currentIndex--;
            if (this.currentIndex < 0) this.currentIndex = this.notes.length - 1;
        } else {
            this.currentIndex++;
        }
    }
}

export const arpEngine = new ArpeggiatorEngine();

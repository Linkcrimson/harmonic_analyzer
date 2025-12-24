import { audioEngine } from './AudioEngine';
import { OscillatorType } from './SynthVoice';
import { positionVector } from '../../not251/src/positionVector';

export type ArpPattern = 'up' | 'down' | 'updown' | 'random';
export type ArpSortMode = 'pitch' | 'harmonic';

export class ArpeggiatorEngine {
    private bpm: number = 120;
    private pattern: ArpPattern = 'up';
    private sortMode: ArpSortMode = 'pitch';
    private division: number = 1 / 8; // 8th notes
    private octaves: number = 1;
    private intervals: Map<number, string> = new Map();
    private active: boolean = false;

    // Core data structures
    private sortedNotes: number[] = [];  // Notes sorted by current mode (harmonic order or pitch)
    private notePositions: positionVector | null = null;  // Position vector for ID-based manipulation

    private notes: number[] = []; // Final expanded note sequence for playback
    private baseNotes: number[] = []; // Original notes from the chord
    private currentIndex: number = 0;
    private nextNoteTime: number = 0;
    private timerId: number | null = null;
    private direction: 1 | -1 = 1;

    private waveform: OscillatorType = 'sine';

    // Harmonic function order for sorting (lower = first)
    // Order: Root -> 2nd/9th -> 3rd -> 4th/11th -> 5th -> 6th/13th -> 7th
    private static readonly HARMONIC_ORDER: Record<string, number> = {
        'root': 0,
        'b9': 1, '9': 2, '#9': 3,
        'third': 4,
        '11': 5, '#11': 6,
        'fifth': 7,
        'b13': 8, '13': 9, '#13': 10,
        'seventh': 11,
        'ext': 12
    };

    public setConfig(config: { bpm?: number, pattern?: ArpPattern, sortMode?: ArpSortMode, division?: number, octaves?: number, waveform?: OscillatorType, intervals?: Map<number, string> }) {
        let rebuildPositions = false;
        let rebuildSequence = false;

        if (config.bpm) this.bpm = config.bpm;
        if (config.pattern && this.pattern !== config.pattern) {
            this.pattern = config.pattern;
            rebuildSequence = true;
        }
        if (config.sortMode && this.sortMode !== config.sortMode) {
            this.sortMode = config.sortMode;
            rebuildPositions = true;
        }
        if (config.division) this.division = config.division;
        if (config.octaves && config.octaves !== this.octaves) {
            this.octaves = config.octaves;
            rebuildSequence = true;
        }
        if (config.waveform) this.waveform = config.waveform;
        if (config.intervals) {
            this.intervals = config.intervals;
            if (this.sortMode === 'harmonic') rebuildPositions = true;
        }

        if (rebuildPositions && this.baseNotes.length > 0) {
            this.buildPositionVector();
            this.buildSequence();
        } else if (rebuildSequence && this.sortedNotes.length > 0) {
            this.buildSequence();
        }
    }

    /**
     * Sorts notes and assigns progressive IDs (0, 1, 2, ...) to create a positionVector.
     * The positionVector enables mathematical operations on note positions.
     */
    private buildPositionVector() {
        const uniqueNotes = [...new Set(this.baseNotes)];

        if (this.sortMode === 'harmonic') {
            // Sort by harmonic function from analysis
            uniqueNotes.sort((a, b) => {
                const typeA = this.intervals.get(a) || this.intervals.get(a % 12) || 'ext';
                const typeB = this.intervals.get(b) || this.intervals.get(b % 12) || 'ext';
                const orderA = ArpeggiatorEngine.HARMONIC_ORDER[typeA] ?? 12;
                const orderB = ArpeggiatorEngine.HARMONIC_ORDER[typeB] ?? 12;

                if (orderA !== orderB) return orderA - orderB;
                return a - b; // Secondary: pitch
            });
        } else {
            // Pitch sort
            uniqueNotes.sort((a, b) => a - b);
        }

        this.sortedNotes = uniqueNotes;

        // Create position vector with progressive IDs [0, 1, 2, ...]
        // modulo = span = length of notes (so element(i) cycles through IDs)
        const ids = Array.from({ length: uniqueNotes.length }, (_, i) => i);
        this.notePositions = new positionVector(ids, uniqueNotes.length, uniqueNotes.length);
    }

    /**
     * Builds the final note sequence for playback using the positionVector.
     * Uses positionVector.element() for cyclic octave expansion.
     */
    private buildSequence() {
        if (!this.notePositions || this.sortedNotes.length === 0) {
            this.notes = [];
            return;
        }

        // Use positionVector.element() for cyclic access with octave expansion
        const totalNotes = this.sortedNotes.length * this.octaves;
        const expanded: number[] = [];

        for (let i = 0; i < totalNotes; i++) {
            const positionId = this.notePositions.element(i);
            const baseNote = this.sortedNotes[positionId % this.sortedNotes.length];
            const octaveOffset = Math.floor(positionId / this.sortedNotes.length) * 12;
            expanded.push(baseNote + octaveOffset);
        }

        this.notes = expanded;
        // Pattern direction is handled in advanceNote()
    }

    public start(notes: number[]) {
        if (notes.length === 0) {
            this.stop();
            return;
        }

        this.baseNotes = [...notes];
        this.buildPositionVector();
        this.buildSequence();

        if (this.active) return; // Already running

        this.active = true;
        this.currentIndex = 0;
        this.nextNoteTime = audioEngine.currentTime;
        this.scheduler();
    }

    public updateNotes(notes: number[]) {
        this.baseNotes = [...notes];
        this.buildPositionVector();
        this.buildSequence();

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

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

    private onNotePlay: ((note: number) => void) | null = null;


    private intervals: Map<number, string> = new Map();
    private harmonicOrderMap: Record<string, number> = {};
    private splitDoublings: boolean = false;
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

    private updateHarmonicOrderMap(order: string[]) {
        this.harmonicOrderMap = {};
        order.forEach((label, index) => {
            // Map the label directly to an index.
            // The mapping from 'interval' to 'label' happens during sort.
            this.harmonicOrderMap[label] = index;
        });
    }

    private getHarmonicCategory(intervalName: string): string {
        // Map raw interval names (e.g. 'b9', '#11') to user categories
        if (!intervalName) return 'root';
        if (intervalName === 'root' || intervalName === 'R') return 'root';
        if (['3', 'b3', 'bb3', 'sus2', 'sus4', 'third'].includes(intervalName)) return '3rd'; // Treat sus as 3rd type for sorting
        if (['5', 'b5', '#5', 'dim5', 'aug5', 'fifth'].includes(intervalName)) return '5th';
        if (['7', 'b7', 'bb7', 'maj7', 'seventh'].includes(intervalName)) return '7th';
        if (['9', 'b9', '#9'].includes(intervalName)) return '9th';
        if (['11', '#11'].includes(intervalName)) return '11th';
        if (['13', 'b13'].includes(intervalName)) return '13th';
        return 'root'; // Fallback
    }

    public setConfig(config: {
        bpm?: number,
        pattern?: ArpPattern,
        sortMode?: ArpSortMode,
        division?: number,
        octaves?: number,
        waveform?: OscillatorType,
        intervals?: Map<number, string>,
        harmonicOrder?: string[],
        splitDoublings?: boolean,
        onNotePlay?: (note: number) => void
    }) {
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
        if (config.harmonicOrder) {
            this.updateHarmonicOrderMap(config.harmonicOrder);
            if (this.sortMode === 'harmonic') rebuildPositions = true;
        }
        if (config.splitDoublings !== undefined && this.splitDoublings !== config.splitDoublings) {
            this.splitDoublings = config.splitDoublings;
            if (this.sortMode === 'harmonic') rebuildPositions = true;
        }
        if (config.onNotePlay) {
            this.onNotePlay = config.onNotePlay;
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
                const typeA = this.intervals.get(a) || this.intervals.get(a % 12) || 'root';
                const typeB = this.intervals.get(b) || this.intervals.get(b % 12) || 'root';

                const catA = this.getHarmonicCategory(typeA);
                const catB = this.getHarmonicCategory(typeB);

                const orderA = this.harmonicOrderMap[catA] ?? 999;
                const orderB = this.harmonicOrderMap[catB] ?? 999;

                if (orderA !== orderB) return orderA - orderB;
                return a - b; // Secondary: pitch
            });

            if (this.splitDoublings) {
                // Logic: Keep first occurrence of each category in 'sequence', move others to 'doublings'
                // But wait, 'uniqueNotes' above has already uniqued by MIDI Pitch!
                // Ah, 'split doublings' usually means if I hold C3 and C4, they are both roots.
                // My baseNotes are MIDI numbers. 
                // So if I have C3, E3, G3, C4.
                // C3 is Root, E3 is 3rd, G3 is 5th, C4 is Root.
                // Standard sort puts C3, C4, E3, G3 (assuming Root < 3rd).
                // Split Doublings should put C3, E3, G3 ... then C4.

                // Refetch all base notes (duplicates allowed if input allowed them, but baseNotes is just numbers)
                // Actually my start(notes) takes a set turned to array, so unique by definition.
                // BUT, they can be octave duplicates.

                // So:
                const primary: number[] = [];
                const secondary: number[] = [];
                const seenCategories = new Set<string>();

                // We need to iterate the sorted uniqueNotes and check their categories
                // Note: uniqueNotes is already sorted by Harmonic Category above.
                // So all Roots are together, all 3rds together.
                // e.g. [C3, C4, E3, G3] -> sorted: [C3(Root), C4(Root), E3(3rd), G3(5th)]

                for (const note of uniqueNotes) {
                    const type = this.intervals.get(note) || this.intervals.get(note % 12) || 'root';
                    const cat = this.getHarmonicCategory(type);
                    if (!seenCategories.has(cat)) {
                        primary.push(note);
                        seenCategories.add(cat);
                    } else {
                        secondary.push(note);
                    }
                }
                // Concat: Primary then Secondary
                // Note: uniqueNotes is a reference to a local array here, so we can reassign it logic-wise or just use the result
                // But sortedNotes is a class property.
                // Wait, the method is modifying 'uniqueNotes' array, then assigning to sortedNotes.

                // Let's do this:
                this.sortedNotes = [...primary, ...secondary];

                // Recalculate IDs for position vector
                const ids = Array.from({ length: this.sortedNotes.length }, (_, i) => i);
                this.notePositions = new positionVector(ids, this.sortedNotes.length, this.sortedNotes.length);
                return; // Early return as we handled it
            }
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

        // Notify callback if time is "now" (close enough)
        // Since we schedule ahead 100ms, we might want to delay the visual update or just fire it.
        // For visual feedback, firing slightly early (ms) is usually fine, or set a timeout.
        const delay = (time - audioEngine.currentTime) * 1000;
        if (delay > 0) {
            setTimeout(() => this.onNotePlay?.(noteId), delay);
        } else {
            this.onNotePlay?.(noteId);
        }
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

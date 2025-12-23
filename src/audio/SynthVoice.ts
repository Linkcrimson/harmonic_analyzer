export type OscillatorType = 'sine' | 'triangle' | 'square' | 'sawtooth';

export class SynthVoice {
    private ctx: AudioContext;
    private output: AudioNode;
    private oscillators: OscillatorNode[] = [];
    private gain: GainNode;
    public isBusy: boolean = false;
    public noteId: number | null = null;
    public timestamp: number = 0; // For voice stealing (LRU)
    private targetVolume: number = 0;

    constructor(ctx: AudioContext, output: AudioNode) {
        this.ctx = ctx;
        this.output = output;

        // Create Voice Gain (Envelope)
        this.gain = this.ctx.createGain();
        this.gain.gain.value = 0;
        this.gain.connect(this.output);
    }

    public triggerAttack(noteId: number, freq: number, time: number, type: OscillatorType = 'sine', volume: number = 0.5) {
        const fadeTime = 0.030; // 15ms mini-fade for old sound on this voice
        this.targetVolume = volume;

        // Fade out existing oscillators on this voice to avoid pops
        if (this.oscillators.length > 0) {
            const oldOscillators = this.oscillators;
            oldOscillators.forEach(osc => {
                try { osc.stop(time + fadeTime); } catch (e) { }
            });
            // Cleanup references after they stop
            setTimeout(() => {
                oldOscillators.forEach(osc => { try { osc.disconnect(); } catch (e) { } });
            }, (time - this.ctx.currentTime + fadeTime) * 1000 + 100);
            this.oscillators = [];
        }

        this.isBusy = true;
        this.noteId = noteId;
        this.timestamp = time;

        const osc = this.ctx.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);

        // Connect
        osc.connect(this.gain);
        osc.start(time);
        this.oscillators.push(osc);

        // Envelope Attack - Anti-Click Linear Ramp
        const attack = 0.005;
        this.gain.gain.cancelScheduledValues(time);

        // Start from 0 to ensure look-and-feel of a new note, but at 'time'
        this.gain.gain.setValueAtTime(0, time);
        this.gain.gain.linearRampToValueAtTime(volume, time + attack);
    }

    public triggerRelease(time: number) {
        if (!this.isBusy) return;

        const release = 0.1; // Snappy release for fast playback

        // Correct scheduling for future release:
        this.gain.gain.cancelScheduledValues(time);

        // If 'time' is in the future, we assume the attack has finished and we are at targetVolume.
        // If 'time' is roughly now, we can use the current gain.
        const isFuture = time > this.ctx.currentTime + 0.01;
        const anchorGain = isFuture ? this.targetVolume : this.gain.gain.value;

        this.gain.gain.setValueAtTime(anchorGain, time);
        this.gain.gain.linearRampToValueAtTime(0, time + release);

        // Stop Oscillator with safety margin
        this.oscillators.forEach(osc => {
            try {
                osc.stop(time + release + 0.1);
            } catch (e) { }
        });

        // Cleanup state after release
        const delayMs = (time - this.ctx.currentTime + release) * 1000 + 100;
        setTimeout(() => {
            if (this.timestamp <= time) { // Allow for equality
                this.isBusy = false;
                this.disconnectOscillators();
            }
        }, Math.max(0, delayMs));
    }

    public setType(type: OscillatorType) {
        this.oscillators.forEach(osc => osc.type = type);
    }

    // Immediate force stop (for stealing) - Now with a micro-fade to prevent clicks
    public forceStop() {
        const now = this.ctx.currentTime;
        const fadeTime = 0.015; // 15ms fade out is usually enough to be "instant" but silent

        this.gain.gain.cancelScheduledValues(now);
        this.gain.gain.setValueAtTime(this.gain.gain.value, now);
        this.gain.gain.linearRampToValueAtTime(0, now + fadeTime);

        this.oscillators.forEach(osc => {
            try { osc.stop(now + fadeTime); } catch (e) { }
            // timeout cleanup will handle disconnect
        });

        setTimeout(() => {
            this.disconnectOscillators();
            this.isBusy = false;
            this.noteId = null;
        }, fadeTime * 1000 + 10);
    }

    private disconnectOscillators() {
        this.oscillators.forEach(osc => {
            try { osc.disconnect(); } catch (e) { }
        });
        this.oscillators = [];
    }
}

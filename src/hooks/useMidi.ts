import { useEffect, useState } from 'react';

export const useMidi = (onNoteOn: (note: number, velocity: number) => void, onNoteOff: (note: number) => void) => {
    const [midiAccess, setMidiAccess] = useState<any>(null);

    useEffect(() => {
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess()
                .then(setMidiAccess)
                .catch((err) => console.error('MIDI access failed', err));
        }
    }, []);

    useEffect(() => {
        if (!midiAccess) return;

        const handleMidiMessage = (event: any) => {
            const [command, note, velocity] = event.data;
            const cmd = command >> 4;

            // Note Off: 0x80 (128) or Note On with velocity 0
            if (cmd === 8 || (cmd === 9 && velocity === 0)) {
                onNoteOff(note);
            }
            // Note On: 0x90 (144)
            else if (cmd === 9) {
                onNoteOn(note, velocity);
            }
        };

        const inputs = midiAccess.inputs.values();
        for (let input of inputs) {
            input.onmidimessage = handleMidiMessage;
        }

        midiAccess.onstatechange = (event: any) => {
            console.log(event.port.name, event.port.state, event.port.type);
        };

        return () => {
            for (let input of inputs) {
                input.onmidimessage = null;
            }
        };
    }, [midiAccess, onNoteOn, onNoteOff]);
};

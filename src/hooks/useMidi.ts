import { useEffect, useState } from 'react';

export const useMidi = (
    onNoteOn: (note: number, velocity: number) => void,
    onNoteOff: (note: number) => void,
    onControlChange?: (cc: number, value: number) => void
) => {
    const [midiAccess, setMidiAccess] = useState<any>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [inputs, setInputs] = useState<string[]>([]);

    useEffect(() => {
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess()
                .then((access: any) => {
                    setMidiAccess(access);
                    setIsConnected(true);
                    updateInputs(access);
                })
                .catch((err) => console.error('MIDI access failed', err));
        }
    }, []);

    const updateInputs = (access: any) => {
        const inputList: string[] = [];
        access.inputs.forEach((input: any) => {
            inputList.push(input.name);
        });
        setInputs(inputList);
    };

    useEffect(() => {
        if (!midiAccess) return;

        const handleMidiMessage = (event: any) => {
            const [command, note, velocity] = event.data;
            const cmd = command >> 4;
            // channel variable removed as it was unused

            // Note Off: 0x80 (128) or Note On with velocity 0
            if (cmd === 8 || (cmd === 9 && velocity === 0)) {
                onNoteOff(note);
            }
            // Note On: 0x90 (144)
            else if (cmd === 9) {
                onNoteOn(note, velocity);
            }
            // Control Change: 0xB0 (176)
            else if (cmd === 11 && onControlChange) {
                // note parameter is CC number, velocity is value
                onControlChange(note, velocity);
            }
        };

        midiAccess.inputs.forEach((input: any) => {
            input.onmidimessage = handleMidiMessage;
        });

        const handleStateChange = (event: any) => {
            console.log('MIDI state changed', event);
            updateInputs(midiAccess);
        };

        // The Web MIDI API spec states that 'statechange' events are fired on the MIDIAccess object.
        midiAccess.onstatechange = handleStateChange;

        return () => {
            midiAccess.inputs.forEach((input: any) => {
                input.onmidimessage = null;
            });
            midiAccess.onstatechange = null;
        };
    }, [midiAccess, onNoteOn, onNoteOff, onControlChange]);

    return { isConnected, inputs };
};


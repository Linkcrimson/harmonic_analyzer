import { positionVector, inverse_select } from '../not251/src/positionVector';
import { getChordName, scaleNames } from '../not251/src/chord';

// --- State & Config ---
const activeNotes = new Set<number>();
let currentWaveform: OscillatorType = 'sine';
const waveforms: OscillatorType[] = ['sine', 'triangle', 'square', 'sawtooth'];

// Waveform Icons (Simple SVG paths)
const waveformIcons: Record<OscillatorType, string> = {
    'sine': '<path d="M2 12s4-8 10-8 10 8 10 8"/>',
    'triangle': '<path d="M2 19l10-14 10 14"/>',
    'square': '<path d="M3 12h6v-8h6v16h6"/>',
    'sawtooth': '<path d="M4 18L20 6v12"/>',
    'custom': '' // Required by OscillatorType
};

// --- Audio Engine ---
const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
let audioCtx: AudioContext;
let masterGain: GainNode;
let compressor: DynamicsCompressorNode;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();

        // Create Master Chain
        masterGain = audioCtx.createGain();
        compressor = audioCtx.createDynamicsCompressor();

        // Compressor settings for balanced output - TUNED FOR CLEAN CHORDS
        compressor.threshold.value = -12;
        compressor.knee.value = 30;
        compressor.ratio.value = 3;       // Gentler compression
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;

        // Connect chain: Compressor -> Master Gain -> Destination
        compressor.connect(masterGain);
        masterGain.connect(audioCtx.destination);

        // Set initial master volume - REDUCED TO PREVENT CLIPPING
        masterGain.gain.value = 1.5;
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function unlockAudio() {
    if (!audioCtx) {
        initAudio();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
            console.log("AudioContext resumed via unlock");
        });
    }
    // Play a silent buffer to force the audio engine to engage
    const buffer = audioCtx.createBuffer(1, 1, 22050);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(compressor);
    source.start(0);

    // Remove listeners once unlocked
    document.removeEventListener('touchstart', unlockAudio);
    document.removeEventListener('click', unlockAudio);
}
// Add global listeners to unlock audio on first interaction
document.addEventListener('touchstart', unlockAudio, { once: true });
document.addEventListener('click', unlockAudio, { once: true });

// --- MIDI Engine ---
function onMidiMessage(event: any) {
    const [command, note, velocity] = event.data;
    const cmd = command >> 4;

    // Note Off: 0x80 (128) or Note On with velocity 0
    if (cmd === 8 || (cmd === 9 && velocity === 0)) {
        handleMidiNoteOff(note);
    }
    // Note On: 0x90 (144)
    else if (cmd === 9) {
        handleMidiNoteOn(note, velocity);
    }
}

function handleMidiNoteOn(midiNote: number, velocity: number) {
    // Map MIDI 60 (C4) to noteId 0
    const noteId = midiNote - 60;

    if (!activeNotes.has(noteId)) {
        activeNotes.add(noteId);
        // Play tone with velocity-sensitive volume
        const vol = (velocity / 127) * 0.8;
        playTone(getFrequency(noteId), 0.4, currentWaveform, vol);
        analyzeChord();
    }
}

function handleMidiNoteOff(midiNote: number) {
    const noteId = midiNote - 60;
    if (activeNotes.has(noteId)) {
        activeNotes.delete(noteId);
        analyzeChord();
    }
}


function initMidi() {
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess()
            .then(onMidiSuccess, onMidiFailure);
    } else {
        console.warn('WebMIDI is not supported in this browser.');
    }
}

function onMidiSuccess(midiAccess: any) {
    console.log('MIDI ready!');
    const inputs = midiAccess.inputs.values();
    for (let input of inputs) {
        input.onmidimessage = onMidiMessage;
    }
    midiAccess.onstatechange = (event: any) => {
        console.log(event.port.name, event.port.state, event.port.type);
    };
}

function onMidiFailure(msg: any) {
    console.error(`Failed to get MIDI access - ${msg}`);
}

function getFrequency(noteId: number) {
    // Mapping: noteId 0 = C3 (MIDI 48)
    const midiNote = 60 + noteId;
    return 440 * Math.pow(2, (midiNote - 69) / 12);
}

function playTone(freq: number, duration = 0.5, type: OscillatorType = 'sine', volume = 1.0, startTime?: number) {
    initAudio();
    const start = startTime || audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const noteGain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);

    // Envelope
    noteGain.gain.setValueAtTime(0, start);
    noteGain.gain.linearRampToValueAtTime(volume, start + 0.05);
    noteGain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(noteGain);
    // Connect to compressor (part of master chain)
    noteGain.connect(compressor);

    osc.start(start);
    osc.stop(start + duration);
}

function playCurrentChord() {
    if (activeNotes.size === 0) return;
    initAudio();
    // Safe volume scaling: 0.4 / N to prevent clipping
    const volPerNote = 0.4 / Math.max(1, activeNotes.size);

    // Sort notes for a nice upward strum
    const sortedNotes = Array.from(activeNotes).sort((a, b) => a - b);

    sortedNotes.forEach((noteId, index) => {
        const freq = getFrequency(noteId);
        // Micro-strum: Stagger notes by 15ms
        const start = audioCtx.currentTime + (index * 0.015);
        playTone(freq, 1.5, currentWaveform, volPerNote, start);
    });
}

// --- Waveform Button Logic ---
function updateWaveformIcon() {
    const btn = document.getElementById('btn-waveform');
    if (!btn) return;
    const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${waveformIcons[currentWaveform]}</svg>`;
    btn.innerHTML = iconSvg;
}

// Initialize button listener
const btnWaveform = document.getElementById('btn-waveform');
if (btnWaveform) {
    updateWaveformIcon();
    btnWaveform.addEventListener('click', () => {
        const currentIndex = waveforms.indexOf(currentWaveform);
        const nextIndex = (currentIndex + 1) % waveforms.length;
        currentWaveform = waveforms[nextIndex];
        updateWaveformIcon();
    });
}

// Map to store the interval type for each active note (e.g., 0 -> 'root', 4 -> 'third')
const noteIntervals = new Map<number, string>();

function modulo(n: number, m: number) { return ((n % m) + m) % m; }

// Map to store note names for display
// Map to store note names for display
const noteNamesMap = new Map<number, string>();

let currentOptions: {
    chordName: string,
    root: positionVector,
    components: {
        rootName: string,
        base: string,
        quality: string[],
        inversion: string,
        intervals: string[],
        detailedAnalysis: {
            thirdQuality: string,
            fifthQuality: string,
            seventhQuality: string,
            extensions: string[]
        }
    },
    intervals: string[],
    detailedAnalysis: {
        thirdQuality: string,
        fifthQuality: string,
        seventhQuality: string,
        extensions: string[]
    }
}[] = [];
let selectedOptionIndex = 0;

function analyzeChord() {
    console.log("analyzeChord: Start");
    // Reset Logic
    // Reset themes
    ['node-root', 'node-char', 'node-stab', 'node-func', 'node-ext'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });

    document.getElementById('chordNameDisplay')!.textContent = "--";
    document.getElementById('chordOptionsContainer')!.innerHTML = ""; // Clear options
    document.getElementById('chordDetail')!.textContent = "";
    document.getElementById('intervalList')!.textContent = "--";
    ['text-root', 'text-char', 'text-stab', 'text-func'].forEach(id => document.getElementById(id)!.textContent = "--");
    document.getElementById('container-extensions')!.textContent = "--";
    document.getElementById('container-omits')!.textContent = "--";

    noteIntervals.clear(); // Clear previous analysis
    noteNamesMap.clear(); // Clear previous note names

    if (activeNotes.size === 0) {
        renderPiano(); // Re-render to clear colors
        return;
    }

    const sortedNotes = Array.from(activeNotes).sort((a, b) => a - b);

    try {
        // Create positionVector from active notes
        const chordVec = new positionVector(sortedNotes, 12, 12).normalizeToModulo();

        //chordVec.spanUpdate();

        console.log("analyzeChord: Calling scaleNames with isChord=true", { chordVecData: chordVec.data });
        // Generate note names using scaleNames
        // scaleNames(scala, ita, useCents, checkEnharmonic, isChord)
        let names: string[] = [];
        try {
            names = scaleNames(chordVec, true, false, true, true);
        } catch (scaleNamesError) {
            console.error("analyzeChord: Error in scaleNames", scaleNamesError);
            throw scaleNamesError; // Re-throw to be caught by outer block
        }

        sortedNotes.forEach((noteId, index) => {
            if (names[index]) {
                noteNamesMap.set(noteId, names[index]);
            }
        });

        console.log("analyzeChord: Calling getChordName");
        // Use not251 to get the name and root
        let chordResult;
        try {
            chordResult = getChordName(chordVec, true);
        } catch (getChordNameError) {
            console.error("analyzeChord: Error in getChordName", getChordNameError);
            throw getChordNameError;
        }

        const { chordName, root, options } = chordResult;
        console.log("getChordName returned:", { chordName, root, optionsLength: options.length, options });

        currentOptions = options;
        selectedOptionIndex = 0;

        // If the returned chordName is not the first option, find it.
        const matchIndex = options.findIndex(o => o.chordName === chordName);
        if (matchIndex !== -1) selectedOptionIndex = matchIndex;
        console.log("selectedOptionIndex:", selectedOptionIndex, "currentOptions[selectedOptionIndex]:", currentOptions[selectedOptionIndex]);

        renderChordOptions();

        // Check if we have valid options before calling updateAnalysisDisplay
        if (currentOptions.length > 0 && currentOptions[selectedOptionIndex]) {
            updateAnalysisDisplay();
        } else {
            // No valid chord analysis - at least mark all notes as 'active' so they show blue
            console.warn("No valid chord analysis available, using fallback coloring");
            sortedNotes.forEach(noteId => {
                noteIntervals.set(noteId, 'active');
            });
        }

    } catch (e) {
        console.error("analyzeChord: CRITICAL ERROR encountered", e);
        console.error("Active Notes at crash:", Array.from(activeNotes));
        // On error, mark all active notes with fallback color
        const sortedNotes = Array.from(activeNotes).sort((a, b) => a - b);
        sortedNotes.forEach(noteId => {
            noteIntervals.set(noteId, 'active');
        });
    } finally {
        // ALWAYS render the piano, even if analysis fails or exits early
        // This ensures keys are updated with current state
        renderPiano();
    }
}

function renderChordOptions() {
    const container = document.getElementById('chordOptionsContainer');
    if (!container) return;
    container.innerHTML = '';

    currentOptions.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.textContent = opt.chordName;
        btn.onclick = () => {
            console.log("Chord option clicked:", index, "currentOptions:", currentOptions);
            selectedOptionIndex = index;
            renderChordOptions();
            console.log("About to call updateAnalysisDisplay with selectedOptionIndex:", selectedOptionIndex);
            updateAnalysisDisplay();
            console.log("Finished updateAnalysisDisplay, about to renderPiano");
            renderPiano(); // Ensure piano renders with new colors
        };
        // Styles
        const baseClasses = ['px-3', 'py-1', 'rounded-full', 'text-xs', 'font-medium', 'transition', 'border'];
        if (index === selectedOptionIndex) {
            btn.classList.add(...baseClasses, 'bg-blue-600', 'text-white', 'border-blue-500', 'shadow-md');
        } else {
            btn.classList.add(...baseClasses, 'bg-gray-800', 'text-gray-400', 'border-gray-700', 'hover:bg-gray-700', 'hover:text-gray-200');
        }
        container.appendChild(btn);
    });
}

function updateAnalysisDisplay() {
    console.log("updateAnalysisDisplay: Start", { activeNotesSize: activeNotes.size, selectedOptionIndex, hasOption: !!currentOptions[selectedOptionIndex] });
    if (activeNotes.size === 0 || !currentOptions[selectedOptionIndex]) {
        console.log("updateAnalysisDisplay: Early exit - activeNotes.size:", activeNotes.size, "currentOptions[selectedOptionIndex]:", currentOptions[selectedOptionIndex]);
        return;
    }

    const { chordName, root } = currentOptions[selectedOptionIndex];
    const sortedNotes = Array.from(activeNotes).sort((a, b) => a - b);
    // Fix: Normalize chordVec so it matches the root (which is 0-11)
    const chordVec = new positionVector(sortedNotes, 12, 12).normalizeToModulo();

    const rootIndex = inverse_select(root, chordVec).data[0];

    // Rotate the chord vector so the root is at the beginning
    const rotatedVec = chordVec.rototranslate(rootIndex, chordVec.data.length, false);

    // Generate names using the rotated vector
    // We pass isChord=false because we've already manually set the "root" by rotating
    const names = scaleNames(rotatedVec, true, false, true, false);

    noteNamesMap.clear();

    // Map names to notes based on pitch class (modulo 12)
    // This handles cases where sortedNotes (absolute) order differs from chordVec (modulo) order
    for (let i = 0; i < names.length; i++) {
        const targetPitchClass = modulo(rotatedVec.data[i], 12);
        sortedNotes.forEach(noteId => {
            if (modulo(noteId, 12) === targetPitchClass) {
                if (names[i]) {
                    noteNamesMap.set(noteId, names[i]);
                }
            }
        });
    }

    // Update Name Display
    const displayEl = document.getElementById('chordNameDisplay')!;
    const { components } = currentOptions[selectedOptionIndex];

    const displayRootName = components.rootName;
    const chordExtensionsStr = components.quality.join("");

    displayEl.innerHTML = ''; // Clear previous content

    const rootSpan = document.createElement('span');

    // Check for accidentals in displayRootName
    const sharpIndex = displayRootName.indexOf('♯');
    const flatIndex = displayRootName.indexOf('♭');
    if (sharpIndex !== -1 || flatIndex !== -1) {
        const splitIndex = sharpIndex !== -1 ? sharpIndex : flatIndex;
        const notePart = displayRootName.substring(0, splitIndex);
        const accidentalPart = displayRootName.substring(splitIndex);

        const noteText = document.createTextNode(notePart);
        rootSpan.appendChild(noteText);

        const accSpan = document.createElement('span');
        accSpan.textContent = accidentalPart;
        // Style to raise the accidental
        accSpan.className = 'inline-block transform -translate-y-3 text-5xl';

        rootSpan.appendChild(accSpan);
    } else {
        rootSpan.textContent = displayRootName;
    }
    displayEl.appendChild(rootSpan);
    let base = components.base;
    let displayQuality = [...components.quality];

    // Move b5 from quality to base
    const b5Index = displayQuality.indexOf("♭5");
    if (b5Index !== -1) {
        displayQuality.splice(b5Index, 1);
        base += "♭5";
    }

    const inversion = components.inversion;
    base = base.replace("dim", "°");

    const baseSpan = document.createElement('span');

    // Check if base contains the degree symbol for custom styling
    if (base.includes("°")) {
        // Split by the symbol to handle cases like "°7"
        const parts = base.split("°");

        // First part (usually empty if it starts with °)
        if (parts[0]) {
            baseSpan.appendChild(document.createTextNode(parts[0]));
        }

        // The symbol itself - make it larger to match ø
        const symbolSpan = document.createElement('span');
        symbolSpan.textContent = "°";
        // Increase size and adjust alignment to match the look of ø
        symbolSpan.className = "text-5xl align-top -mt-1 inline-block";
        baseSpan.appendChild(symbolSpan);

        // The rest (e.g., "7")
        if (parts[1]) {
            baseSpan.appendChild(document.createTextNode(parts[1]));
        }
    } else {
        baseSpan.textContent = base;
    }

    displayEl.appendChild(baseSpan);

    if (displayQuality.length > 0) {
        if (displayQuality.length > 1) {
            const extContainer = document.createElement('span');
            extContainer.className = 'inline-flex items-center align-top mx-1 -mt-2';

            const openParen = document.createElement('span');
            openParen.textContent = '(';
            openParen.className = 'text-4xl text-gray-400 font-light mr-1 transform scale-y-150 origin-center';

            const stackDiv = document.createElement('div');
            stackDiv.className = 'flex flex-col justify-center leading-none text-center';

            displayQuality.forEach(ext => {
                const extSpan = document.createElement('span');
                extSpan.textContent = ext;
                extSpan.className = 'text-xl text-gray-300 font-medium tracking-tight my-0.5';
                stackDiv.appendChild(extSpan);
            });

            const closeParen = document.createElement('span');
            closeParen.textContent = ')';
            closeParen.className = 'text-4xl text-gray-400 font-light ml-1 transform scale-y-150 origin-center';

            extContainer.appendChild(openParen);
            extContainer.appendChild(stackDiv);
            extContainer.appendChild(closeParen);

            displayEl.appendChild(extContainer);
        } else {
            const extSpan = document.createElement('span');
            extSpan.className = 'text-4xl align-top -mt-2 inline-block text-gray-300 font-medium tracking-normal ml-1';
            extSpan.textContent = displayQuality[0];
            displayEl.appendChild(extSpan);
        }
    }

    if (inversion) {
        const invSpan = document.createElement('span');
        invSpan.className = 'ml-1';

        // Check for accidentals in inversion
        const sharpIndex = inversion.indexOf('♯');
        const flatIndex = inversion.indexOf('♭');

        if (sharpIndex !== -1 || flatIndex !== -1) {
            const splitIndex = sharpIndex !== -1 ? sharpIndex : flatIndex;
            const notePart = inversion.substring(0, splitIndex);
            const accidentalPart = inversion.substring(splitIndex);

            const noteText = document.createTextNode(notePart);
            invSpan.appendChild(noteText);

            const accSpan = document.createElement('span');
            accSpan.textContent = accidentalPart;
            // Style to raise the accidental
            accSpan.className = 'inline-block transform -translate-y-3 text-5xl';

            invSpan.appendChild(accSpan);
        } else {
            invSpan.textContent = inversion;
        }
        displayEl.appendChild(invSpan);
    }

    // Use intervals directly from analysis
    const intervalTypes = currentOptions[selectedOptionIndex].intervals;
    const rootVal = root.data[0]; // This is 0-11

    // --- Initialize all notes as extensions (default color) ---
    const rootPitchClass = rootVal; // 0-11
    noteIntervals.clear();
    console.log("Cleared noteIntervals, about to initialize with 'ext'");
    sortedNotes.forEach(noteId => {
        noteIntervals.set(noteId, 'ext');
    });

    // Helper function to assign color to notes matching an interval
    const assignColorToInterval = (semitones: number[], color: string) => {
        sortedNotes.forEach(noteId => {
            const notePitchClass = modulo(noteId, 12);
            const interval = modulo(notePitchClass - rootPitchClass, 12);
            if (semitones.includes(interval)) {
                console.log(`Assigning color ${color} to noteId ${noteId} (interval ${interval})`);
                noteIntervals.set(noteId, color);
            }
        });
    };

    // Reset active classes
    ['node-root', 'node-char', 'node-stab', 'node-func'].forEach(id => {
        document.getElementById(id)!.classList.remove('active');
    });

    // 1. Root
    document.getElementById('node-root')!.classList.add('active');
    const rootName = noteNamesMap.get(rootVal)!;
    document.getElementById('text-root')!.textContent = rootName;
    assignColorToInterval([0], 'root');

    // 2. Quality (3rd)
    const charNode = document.getElementById('node-char')!;
    const { thirdQuality, fifthQuality, seventhQuality, extensions } = currentOptions[selectedOptionIndex].detailedAnalysis;

    charNode.classList.add('active');
    document.getElementById('text-char')!.textContent = thirdQuality;

    // Assign colors based on quality
    if (thirdQuality === "Maggiore") assignColorToInterval([4], 'third');
    else if (thirdQuality === "Minore") assignColorToInterval([3], 'third');
    else if (thirdQuality === "Sus 2") assignColorToInterval([2], 'third');
    else if (thirdQuality === "Sus 4") assignColorToInterval([5], 'third');
    else charNode.classList.remove('active'); // Should not happen with current logic but safe fallback

    // 3. Stability (5th)
    const stabNode = document.getElementById('node-stab')!;
    stabNode.classList.add('active');
    document.getElementById('text-stab')!.textContent = fifthQuality;

    if (fifthQuality === "Giusta") assignColorToInterval([7], 'fifth');
    else if (fifthQuality === "Aumentata") assignColorToInterval([8], 'fifth');
    else if (fifthQuality === "Diminuita") assignColorToInterval([6], 'fifth');
    else if (fifthQuality === "Omessa") stabNode.classList.remove('active');

    // 4. Function (7th)
    const funcNode = document.getElementById('node-func')!;
    funcNode.classList.add('active');
    document.getElementById('text-func')!.textContent = seventhQuality;

    if (seventhQuality === "Mag 7") assignColorToInterval([11], 'seventh');
    else if (seventhQuality === "Min 7") assignColorToInterval([10], 'seventh');
    else if (seventhQuality === "Sesta/Dim") assignColorToInterval([9], 'seventh');
    else if (seventhQuality === "Triade") funcNode.classList.remove('active');

    // Extensions
    const extContainer = document.getElementById('container-extensions')!;
    const extNode = document.getElementById('node-ext')!;

    if (extensions.length > 0) {
        extContainer.textContent = extensions.join(", ");
        extNode.classList.add('active');
    } else {
        extContainer.textContent = "Nessuna";
        extNode.classList.remove('active');
    }

    console.log("updateAnalysisDisplay complete. Final noteIntervals:", Array.from(noteIntervals.entries()));
    // Note: renderPiano() is called by analyzeChord() in the finally block or by option click handler
}


function addInputListeners(element: HTMLElement, noteId: number) {
    const handleStart = (e: Event) => {
        // Prevent default to stop scrolling/zooming/selection on touch
        if (e.type === 'touchstart') {
            e.preventDefault();
        }

        // Ensure audio is unlocked since we are stopping propagation
        unlockAudio();

        // Stop propagation to prevent triggering parent elements (black key -> white key)
        e.stopPropagation();

        toggleNote(noteId);
    };

    element.addEventListener('mousedown', handleStart);
    element.addEventListener('touchstart', handleStart, { passive: false });
}

function renderPiano() {
    const keyboard = document.getElementById('keyboard');
    if (!keyboard) return;
    keyboard.innerHTML = '';

    const octavePattern = [
        { noteIndex: 0, label: 'Do', hasBlackLeft: false },
        { noteIndex: 2, label: 'Re', hasBlackLeft: true },
        { noteIndex: 4, label: 'Mi', hasBlackLeft: true },
        { noteIndex: 5, label: 'Fa', hasBlackLeft: false },
        { noteIndex: 7, label: 'Sol', hasBlackLeft: true },
        { noteIndex: 9, label: 'La', hasBlackLeft: true },
        { noteIndex: 11, label: 'Si', hasBlackLeft: true }
    ];

    const numOctaves = 2; // C3 to B4 (2 complete octaves)

    for (let oct = 0; oct < numOctaves; oct++) {
        octavePattern.forEach(keyData => {
            const whiteNoteId = keyData.noteIndex + (oct * 12);

            // Determine color class
            let colorClass = '';
            if (activeNotes.has(whiteNoteId)) {
                const type = noteIntervals.get(whiteNoteId);
                if (type) colorClass = `key-${type}`;
                else colorClass = 'active'; // Fallback
            }

            let displayText = '';
            if (activeNotes.has(whiteNoteId) && noteNamesMap.has(whiteNoteId)) {
                displayText = noteNamesMap.get(whiteNoteId)!;
            } else if (keyData.noteIndex === 0) {
                displayText = `C${oct + 4}`;
            }

            const wKey = document.createElement('div');
            wKey.className = `white-key relative flex-1 h-full border border-gray-800 rounded-b cursor-pointer flex items-end justify-center pb-2 text-sm text-gray-500 select-none ${colorClass}`;
            wKey.style.zIndex = '1';
            if (activeNotes.has(whiteNoteId)) {
                wKey.style.color = 'white';
                wKey.style.fontWeight = 'bold';
            }
            wKey.textContent = displayText;

            // Use new helper for listeners
            addInputListeners(wKey, whiteNoteId);

            if (keyData.hasBlackLeft) {
                const blackNoteId = whiteNoteId - 1;

                let blackColorClass = '';
                if (activeNotes.has(blackNoteId)) {
                    const type = noteIntervals.get(blackNoteId);
                    if (type) blackColorClass = `key-${type}`;
                    else blackColorClass = 'active';
                }


                let blackDisplayText = '';
                if (activeNotes.has(blackNoteId) && noteNamesMap.has(blackNoteId)) {
                    blackDisplayText = noteNamesMap.get(blackNoteId)!;
                }

                const bKey = document.createElement('div');
                // Changed w-[60%] to style.width for better control if needed, but class is fine too.
                // Keeping w-[60%] as requested in plan, but ensuring it's relative to parent.
                bKey.className = `black-key absolute top-0 h-2/3 w-[60%] rounded-b border border-black cursor-pointer flex items-end justify-center pb-2 text-[10px] select-none ${blackColorClass}`;
                bKey.style.left = "0";
                bKey.style.transform = "translateX(-50%)";
                bKey.style.zIndex = '10';
                if (activeNotes.has(blackNoteId)) {
                    bKey.style.color = 'white';
                    bKey.style.fontWeight = 'bold';
                } else {
                    bKey.style.color = 'transparent';
                }
                bKey.textContent = blackDisplayText;

                // Use new helper for listeners
                addInputListeners(bKey, blackNoteId);

                wKey.appendChild(bKey);
            }
            keyboard.appendChild(wKey);
        });
    }

    // Add final C5 note
    const finalC = 24; // C5 (2 octaves * 12 = 24 semitones from C3)
    let finalColorClass = '';
    if (activeNotes.has(finalC)) {
        const type = noteIntervals.get(finalC);
        if (type) finalColorClass = `key-${type}`;
        else finalColorClass = 'active';
    }

    let finalDisplayText = 'C6';
    if (activeNotes.has(finalC) && noteNamesMap.has(finalC)) {
        finalDisplayText = noteNamesMap.get(finalC)!;
    }

    const finalKey = document.createElement('div');
    finalKey.className = `white-key relative flex-1 h-full border border-gray-800 rounded-b cursor-pointer flex items-end justify-center pb-2 text-sm text-gray-500 select-none ${finalColorClass}`;
    finalKey.style.zIndex = '1';
    if (activeNotes.has(finalC)) {
        finalKey.style.color = 'white';
        finalKey.style.fontWeight = 'bold';
    }
    finalKey.textContent = finalDisplayText;

    // Use new helper for listeners
    addInputListeners(finalKey, finalC);

    keyboard.appendChild(finalKey);
}

function toggleNote(id: number) {
    if (activeNotes.has(id)) {
        activeNotes.delete(id);
    } else {
        activeNotes.add(id);
        playTone(getFrequency(id), 0.4, currentWaveform, 0.8);
    }
    analyzeChord(); // This calls renderPiano at the end
}

function resetPiano() {
    activeNotes.clear();
    noteIntervals.clear();
    analyzeChord();
}

// Expose functions to window for HTML onclick handlers
(window as any).playCurrentChord = playCurrentChord;
(window as any).resetPiano = resetPiano;

// Initial Render - Wait for DOM to be ready
function initializeApp() {
    try {
        renderPiano();
        initMidi();
    } catch (e) {
        console.error("Error during initial renderPiano:", e);
    }
}

// Check if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already ready, execute immediately
    initializeApp();
}

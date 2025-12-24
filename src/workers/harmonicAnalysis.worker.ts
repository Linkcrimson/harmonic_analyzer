/* eslint-disable no-restricted-globals */
import { positionVector, inverse_select } from '../../not251/src/positionVector';
import { getChordName, spellingNotes } from '../../not251/src/chord';

// Define the interface for the message received from the main thread
interface AnalysisRequest {
    activeNotes: number[];
    selectedIndex: number;
    bassAsRoot: boolean;
    useEnharmonic: boolean;
    requestId: number;
}

// Define the interface for the response sent back to the main thread
export interface AnalysisResponse {
    requestId: number;
    chordOptions: any[];
    analysis: {
        rootName: string;
        quality: string;
        stability: string;
        function: string;
        extensions: string[];
        intervals: Array<[number, string]>;
        noteNames: Array<[number, string]>;
        flags: {
            isRootActive: boolean;
            isThirdActive: boolean;
            isFifthActive: boolean;
            isSeventhActive: boolean;
        };
    };
}

// [PERFORMANCE FIX] Simple memoization cache
const analysisCache = new Map<string, any>();

self.onmessage = (e: MessageEvent<AnalysisRequest>) => {
    const { activeNotes, selectedIndex, bassAsRoot, useEnharmonic, requestId } = e.data;
    const cacheKey = `${activeNotes.join(',')}|${selectedIndex}|${bassAsRoot}|${useEnharmonic}`;

    if (analysisCache.has(cacheKey)) {
        self.postMessage({ ...analysisCache.get(cacheKey), requestId });
        return;
    }

    const notes = new Set(activeNotes);

    if (notes.size === 0) {
        self.postMessage({
            requestId,
            chordOptions: [],
            analysis: {
                rootName: '--',
                quality: '--',
                stability: '--',
                function: '--',
                extensions: [],
                intervals: new Map(),
                noteNames: new Map(),
                flags: {
                    isRootActive: false,
                    isThirdActive: false,
                    isFifthActive: false,
                    isSeventhActive: false
                }
            }
        });
        return;
    }

    const sortedNotes = Array.from(notes).sort((a, b) => a - b);
    const chordVec = new positionVector(sortedNotes, 12, 12).normalizeToModulo();

    let names: string[] = [];
    try {
        names = spellingNotes(chordVec, true, false, useEnharmonic, false);
    } catch (e) {
        console.error(e);
    }

    const newNoteNames = new Map<number, string>();
    sortedNotes.forEach((noteId, index) => {
        if (names[index]) newNoteNames.set(noteId, names[index]);
    });

    let options: any[] = [];
    try {
        const res = getChordName(chordVec, !bassAsRoot);
        options = res.options;
    } catch (e) {
        console.error(e);
    }

    if (options.length > 0 && options[selectedIndex]) {
        const selected = options[selectedIndex];
        const { root, components, detailedAnalysis } = selected;

        const rootIndex = inverse_select(root, chordVec).data[0];
        const rotatedVec = chordVec.rototranslate(rootIndex, chordVec.data.length, false);
        const rotatedNames = spellingNotes(rotatedVec, true, false, useEnharmonic, false);

        const modulo = (n: number, m: number) => ((n % m) + m) % m;
        for (let i = 0; i < rotatedNames.length; i++) {
            const targetPitchClass = modulo(rotatedVec.data[i], 12);
            sortedNotes.forEach(noteId => {
                if (modulo(noteId, 12) === targetPitchClass) {
                    if (rotatedNames[i]) newNoteNames.set(noteId, rotatedNames[i]);
                }
            });
        }

        const newIntervals = new Map<number, string>();
        const rootPitchClass = root.data[0];

        const mapInterval = (semitones: number[], type: string) => {
            sortedNotes.forEach(noteId => {
                const notePitchClass = modulo(noteId, 12);
                const interval = modulo(notePitchClass - rootPitchClass, 12);
                if (semitones.includes(interval)) newIntervals.set(noteId, type);
            });
        };

        sortedNotes.forEach(n => newIntervals.set(n, 'ext'));
        mapInterval([0], 'root');

        const { thirdQuality, fifthQuality, seventhQuality } = detailedAnalysis;

        if (thirdQuality === "Maggiore") mapInterval([4], 'third');
        else if (thirdQuality === "Minore") mapInterval([3], 'third');
        else if (thirdQuality === "Sus 2") mapInterval([2], 'third');
        else if (thirdQuality === "Sus 4") mapInterval([5], 'third');

        if (fifthQuality === "Giusta") mapInterval([7], 'fifth');
        else if (fifthQuality === "Aumentata") mapInterval([8], 'fifth');
        else if (fifthQuality === "Diminuita") mapInterval([6], 'fifth');

        if (seventhQuality === "Mag 7") mapInterval([11], 'seventh');
        else if (seventhQuality === "Min 7") mapInterval([10], 'seventh');
        else if (seventhQuality === "Sesta/Dim") mapInterval([9], 'seventh');

        // Map extensions to their specific types
        // 2nd/9th family (intervals 1, 2)
        mapInterval([1], 'b9');
        mapInterval([2], '9');
        // 4th/11th family (intervals 5, 6)  
        mapInterval([5], '11');
        mapInterval([6], '#11');
        // 6th/13th family (intervals 8, 9)
        mapInterval([8], 'b13');
        mapInterval([9], '13');  // Note: may override seventh if Sesta/Dim, that's ok

        const intervalValues = Array.from(newIntervals.values());

        const response = {
            chordOptions: options,
            analysis: {
                rootName: components.rootName,
                quality: detailedAnalysis.thirdQuality,
                stability: detailedAnalysis.fifthQuality,
                function: detailedAnalysis.seventhQuality,
                extensions: detailedAnalysis.extensions,
                intervals: Array.from(newIntervals),
                noteNames: Array.from(newNoteNames),
                flags: {
                    isRootActive: intervalValues.includes('root'),
                    isThirdActive: intervalValues.includes('third'),
                    isFifthActive: intervalValues.includes('fifth'),
                    isSeventhActive: intervalValues.includes('seventh')
                }
            }
        };
        analysisCache.set(cacheKey, response);
        self.postMessage({ ...response, requestId });
    } else {
        const fallbackIntervals = new Map<number, string>();
        sortedNotes.forEach(n => fallbackIntervals.set(n, 'active'));

        const response = {
            chordOptions: options,
            analysis: {
                rootName: '--',
                quality: '--',
                stability: '--',
                function: '--',
                extensions: [],
                intervals: Array.from(fallbackIntervals),
                noteNames: Array.from(newNoteNames),
                flags: {
                    isRootActive: false,
                    isThirdActive: false,
                    isFifthActive: false,
                    isSeventhActive: false
                }
            }
        };
        analysisCache.set(cacheKey, response);
        self.postMessage({ ...response, requestId });
    }
};

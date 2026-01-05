/* eslint-disable no-restricted-globals */
import { positionVector, inverse_select, getChordName, spellingNotes } from '@not251/not251';

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

        // Use the native noteRoles from not251
        // Mapping not251 internal roles to WebApp UI roles:
        // root -> root
        // 3maj, 3min, 3dim, 3aug, 2, 4 (sus) -> third
        // 5, 5dim, 5aug -> fifth
        // 7maj, 7min, 6, 7dim -> seventh
        // everything else -> ext (or specific extension name if WebApp handles it)

        // Actually, the WebApp seems to use specific keys like 'b9', '#11' in mapExtension calls below.
        // Let's preserve that granularity but use the source of truth from not251.

        // DEBUGGING LOGS
        console.log("Worker Analysis Option:", selected);
        console.log("Worker noteRoles:", selected.noteRoles);

        const roles = Array.from(selected.noteRoles?.values() || []) as string[];
        const hasSeventh = roles.some(r => ['7maj', '7min', '7dim'].includes(r));
        const thirdQuality = selected.detailedAnalysis?.thirdQuality;

        selected.noteRoles?.forEach((role: string, noteId: number) => {
            console.log(`Mapping Note ${noteId} -> ${role}`);
            let uiRole = 'ext';

            if (role === 'root') uiRole = 'root';
            // Thirds
            else if (['3maj', '3min', '3dim', '3aug'].includes(role)) {
                uiRole = 'third';
            }
            // Sus vs Extension
            else if (role === '2') {
                if (thirdQuality === 'Sus 2') uiRole = 'third';
                else uiRole = '9';
            }
            else if (role === '4') {
                if (thirdQuality === 'Sus 4') uiRole = 'third';
                else uiRole = '11';
            }
            else if (['5', '5dim', '5aug'].includes(role)) uiRole = 'fifth';
            else if (['7maj', '7min', '7dim'].includes(role)) uiRole = 'seventh';
            else if (role === '6') {
                // Contextual mapping for 6th:
                // If a 7th is present, the 6th is an extension (13th).
                // If no 7th is present, the 6th acts as the "seventh" function (e.g. C6).
                uiRole = hasSeventh ? '13' : 'seventh';
            }
            // Explicit Extension Mapping (Theoretical -> Jazz UI)
            else if (role === '2min') uiRole = 'b9';
            else if (role === '2aug') uiRole = '#9';
            else if (role === '4aug') uiRole = '#11';
            else if (role === '6min') uiRole = 'b13';
            else if (role === '6aug') uiRole = '#13';

            else {
                // For extensions, pass the specific role (e.g., 'b9', '13', etc.)
                // The UI likely expects these specific strings for tooltips/display
                uiRole = role;
            }
            newIntervals.set(noteId, uiRole);
        });

        // Ensure all active notes have at least a default role if not found (shouldn't happen with correct logic)
        sortedNotes.forEach(n => {
            if (!newIntervals.has(n)) newIntervals.set(n, 'ext');
        });

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

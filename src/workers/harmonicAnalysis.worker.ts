/* eslint-disable no-restricted-globals */
import { PositionVector, analyzeChord, spellingNotes, role } from '@alchemusa/core';

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
    const chordVec = new PositionVector(sortedNotes, 12, 12).normalize('min', true);

    const newNoteNames = new Map<number, string>();
    let options: any[] = [];
    try {
        const res = analyzeChord(chordVec, !bassAsRoot);
        options = res.options;
    } catch (e) {
        console.error(e);
    }

    const modulo = (n: number, m: number) => ((n % m) + m) % m;

    if (options.length > 0 && options[selectedIndex]) {
        const selected = options[selectedIndex];
        // In Alchemusa ChordCandidate, properties are top-level
        const { rootName, quality, base, inversion, detailedAnalysis } = selected;

        const rootIndex = chordVec.findIndices(selected.root).data[0] || 0;
        const rotatedVec = chordVec.rotate(rootIndex, chordVec.data.length, false);
        const rotatedNames = spellingNotes(rotatedVec, true, false, useEnharmonic, 0);

        for (let i = 0; i < rotatedNames.length; i++) {
            const targetPitchClass = modulo(rotatedVec.data[i], 12);
            sortedNotes.forEach(noteId => {
                if (modulo(noteId, 12) === targetPitchClass) {
                    if (rotatedNames[i]) newNoteNames.set(noteId, rotatedNames[i]);
                }
            });
        }

        const newIntervals = new Map<number, string>();

        const rolesList = Array.from(selected.noteRoles?.values() || []) as number[];
        const hasSeventh = rolesList.some(r => [role.i7.major, role.i7.minor, role.i7.diminished].includes(r as any));
        const thirdQuality = selected.detailedAnalysis?.thirdQuality;
        
        const roleByPitchClass = new Map<number, string>();

        selected.noteRoles?.forEach((roleId: number, noteId: number) => {
            let uiRole = 'ext';

            if (roleId === role.i1) uiRole = 'root';
            else if ([role.i3.major, role.i3.minor, role.i3.diminished, role.i3.augmented].includes(roleId as any)) uiRole = 'third';
            else if (roleId === role.i2.major) uiRole = thirdQuality === 'Sus 2' ? 'third' : '9';
            else if (roleId === role.i4.perfect) uiRole = thirdQuality === 'Sus 4' ? 'third' : '11';
            else if ([role.i5.perfect, role.i5.diminished, role.i5.augmented].includes(roleId as any)) uiRole = 'fifth';
            else if ([role.i7.major, role.i7.minor, role.i7.diminished].includes(roleId as any)) uiRole = 'seventh';
            else if (roleId === role.i6.major) uiRole = hasSeventh ? '13' : 'seventh';
            else if (roleId === role.i2.minor) uiRole = 'b9';
            else if (roleId === role.i2.augmented) uiRole = '#9';
            else if (roleId === role.i4.augmented) uiRole = '#11';
            else if (roleId === role.i6.minor) uiRole = 'b13';
            else if (roleId === role.i6.augmented) uiRole = '#13';
            else if (roleId === role.i9.major) uiRole = '9';
            else if (roleId === role.i9.minor) uiRole = 'b9';
            else if (roleId === role.i9.augmented) uiRole = '#9';
            else if (roleId === role.i11.perfect) uiRole = '11';
            else if (roleId === role.i11.augmented) uiRole = '#11';
            else if (roleId === role.i13.major) uiRole = '13';
            else if (roleId === role.i13.minor) uiRole = 'b13';
            
            roleByPitchClass.set(modulo(noteId, 12), uiRole);
        });

        // Propagate roles to all octaves of the same pitch class
        sortedNotes.forEach(n => {
            const pc = modulo(n, 12);
            const uiRole = roleByPitchClass.get(pc) || 'ext';
            newIntervals.set(n, uiRole);
        });

        const intervalValues = Array.from(newIntervals.values());

        const response = {
            chordOptions: options,
            analysis: {
                rootName: rootName,
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
            requestId,
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

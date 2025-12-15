import { positionVector } from './positionVector';
import { getChordName, spellingNotes } from './chord';

// Test case: [0, 4, 6, 10] = C, E, Gb, Bb = C7b5
const testChord = new positionVector([0, 4, 6, 10], 12, 12);

const analysis = testChord.degreeFunction();
console.log('intervalTypes:', Array.from(analysis.intervalTypes));

const result = getChordName(testChord, false);
console.log('chordName:', result.chordName);

const spelling = spellingNotes(testChord, false, false, false);
console.log('spelling:', spelling);

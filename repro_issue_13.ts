
import { analyzeChord } from './not251/src/chord';
import { positionVector } from './not251/src/positionVector';

// Cmaj7 #13: C (0), E (4), G (7), A# (10), B (11)
const notes = [0, 4, 7, 10, 11];
const pv = new positionVector(notes, 12, 12);

const analysis = analyzeChord(pv);

console.log("Chord Name:", analysis.base + (analysis.quality.join("")));
console.log("Extensions:", analysis.detailedAnalysis.extensions);

if (!analysis.detailedAnalysis.extensions.includes("#13") && !analysis.detailedAnalysis.extensions.includes("♯13")) {
    console.error("FAIL: #13 extension missing!");
    process.exit(1);
} else {
    console.log("PASS: #13 extension found.");
}

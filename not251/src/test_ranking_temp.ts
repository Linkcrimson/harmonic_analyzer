import { analyzeChord } from "./chord";
import { positionVector } from "./positionVector";

function testChordRanking() {
    console.log("Starting Chord Ranking Tests...");

    // Test Case 1: Cmaj9 vs Em7/C
    // Notes: C (0), D (2), E (4), G (7), B (11)
    const cmaj9 = new positionVector([0, 2, 4, 7, 11], 12, 12);
    const result1 = analyzeChord(cmaj9, true);

    console.log("\nTest Case 1: Cmaj9 (C E G B D)");
    console.log("Selected Quality:", result1.quality.join(""));
    console.log("Selected Inversion:", result1.inversion);
    console.log("Root:", result1.root.data[0]); // Should be 0 (C)

    // Check if it preferred Cmaj9 over Em7/C
    // Em7 would be Root E (4).
    if (result1.root.data[0] === 0 && result1.quality.includes("9")) {
        console.log("PASS: Correctly identified as Cmaj9");
    } else {
        console.log("FAIL: Identified as " + result1.root.data[0] + " " + result1.quality.join("") + result1.inversion);
    }

    // Test Case 2: D9 vs Am6/D
    // Notes: D (2), E (4), F# (6), A (9), C (0) -> D9
    // D (2), F# (6), A (9), C (0), E (4)
    // Sorted: 0, 2, 4, 6, 9
    const d9 = new positionVector([0, 2, 4, 6, 9], 12, 12);
    // Wait, D9 is D F# A C E.
    // D=2, F#=6, A=9, C=0 (or 12), E=4 (or 16).
    // Modulo 12: 0, 2, 4, 6, 9.
    const result2 = analyzeChord(d9, true);

    console.log("\nTest Case 2: D9 (D F# A C E)");
    console.log("Selected Quality:", result2.quality.join(""));
    console.log("Selected Inversion:", result2.inversion);
    console.log("Root:", result2.root.data[0]); // Should be 2 (D)

    if (result2.root.data[0] === 2 && result2.quality.includes("9")) {
        console.log("PASS: Correctly identified as D9");
    } else {
        console.log("FAIL: Identified as " + result2.root.data[0] + " " + result2.quality.join("") + result2.inversion);
    }

    // Test Case 3: C/E
    // Notes: E (4), G (7), C (0)
    const c_over_e = new positionVector([0, 4, 7], 12, 12);
    // Note: positionVector constructor doesn't enforce order, but analyzeChord sorts internally.
    // However, for slash chords, the input order might matter if I was passing it differently, 
    // but analyzeChord rotates and checks all inversions.
    // Wait, analyzeChord logic:
    // It tries every rotation as a candidate root.
    // So for [0, 4, 7], it tries:
    // Root 0 (C): Intervals 0, 4, 7 -> Major Triad. Inversion: /E (if lowest note is E).
    // Wait, how does it know the lowest note?
    // `analyzeChord` takes `chordVector`.
    // It normalizes it: `chord = chord.sum(-chordVector.data[0]); ... chord.data.sort ...`
    // It loses the original voicing information for the analysis of the *name*, 
    // BUT it uses `chordVector.data[0]` (the bass) to determine the inversion string.
    // `if (allowSlashChords && i !== 0) ... inversion = ...`
    // Actually, `analyzeChord` iterates `i` from 0 to length.
    // `candidate = chord.rototranslate(i, ...)`
    // If `i=0`, it's the root position candidate.
    // If `i!=0`, it's an inversion.
    // The `inversion` string is calculated based on `bassIndex`.

    // My `c_over_e` vector is [0, 4, 7]. Sorted.
    // If I want to test C/E, I should probably ensure the input vector reflects the voicing if that matters?
    // `analyzeChord` sorts the input `chordVector` at the beginning!
    // `chord.data.sort((a, b) => a - b);`
    // So [0, 4, 7] is C, E, G.
    // The bass note of the *input* vector is `chordVector.data[0]`.
    // If I pass [4, 7, 12] (E, G, C), then bass is E.
    // Let's try to construct it such that E is the lowest.
    const c_over_e_voiced = new positionVector([4, 7, 12], 12, 12);
    const result3 = analyzeChord(c_over_e_voiced, true);

    console.log("\nTest Case 3: C/E (E G C)");
    console.log("Selected Quality:", result3.quality.join(""));
    console.log("Selected Inversion:", result3.inversion);
    console.log("Root:", result3.root.data[0]); // Should be 0 (C) (normalized modulo)

    // We expect Root C (0), Quality Major (empty or ""), Inversion /E
    // Note: Root returned is normalized to modulo 12. 12 becomes 0.
    if (result3.root.data[0] === 0 && result3.inversion.includes("E")) {
        console.log("PASS: Correctly identified as C/E");
    } else {
        console.log("FAIL: Identified as " + result3.root.data[0] + " " + result3.quality.join("") + result3.inversion);
    }

}

testChordRanking();

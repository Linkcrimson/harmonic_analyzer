import { analyzeChord } from "./chord";
import { positionVector } from "./positionVector";

function test9thChordRanking() {
    console.log("Starting 9th Chord Ranking Tests...");

    // Test Case 1: C9
    // Notes: C (0), E (4), G (7), Bb (10), D (2)
    const c9 = new positionVector([0, 4, 7, 10, 2], 12, 12);
    const result1 = analyzeChord(c9, true);

    console.log("\nTest Case 1: C9 (C E G Bb D)");
    console.log("Selected Base:", result1.base);
    console.log("Selected Quality:", result1.quality.join(""));
    console.log("Selected Inversion:", result1.inversion);
    console.log("Root:", result1.root.data[0]);

    // Expected: Root C (0), Base "9", Quality empty (or at least not containing "9" again)
    if (result1.root.data[0] === 0 && result1.base === "9" && !result1.quality.includes("9")) {
        console.log("PASS: Correctly identified as C9");
    } else {
        console.log("FAIL: Identified as " + result1.root.data[0] + result1.base + result1.quality.join("") + result1.inversion);
    }

    // Test Case 2: Cmaj9
    // Notes: C (0), E (4), G (7), B (11), D (2)
    const cmaj9 = new positionVector([0, 4, 7, 11, 2], 12, 12);
    const result2 = analyzeChord(cmaj9, true);

    console.log("\nTest Case 2: Cmaj9 (C E G B D)");
    console.log("Selected Base:", result2.base);
    console.log("Selected Quality:", result2.quality.join(""));
    console.log("Selected Inversion:", result2.inversion);
    console.log("Root:", result2.root.data[0]);

    // Expected: Root C (0), Base "maj9", Quality empty
    if (result2.root.data[0] === 0 && result2.base === "maj9" && !result2.quality.includes("9")) {
        console.log("PASS: Correctly identified as Cmaj9");
    } else {
        console.log("FAIL: Identified as " + result2.root.data[0] + result2.base + result2.quality.join("") + result2.inversion);
    }

    // Test Case 3: Cm9
    // Notes: C (0), Eb (3), G (7), Bb (10), D (2)
    const cm9 = new positionVector([0, 3, 7, 10, 2], 12, 12);
    const result3 = analyzeChord(cm9, true);

    console.log("\nTest Case 3: Cm9 (C Eb G Bb D)");
    console.log("Selected Base:", result3.base);
    console.log("Selected Quality:", result3.quality.join(""));
    console.log("Selected Inversion:", result3.inversion);
    console.log("Root:", result3.root.data[0]);

    // Expected: Root C (0), Base "-9" or "min9" (depending on implementation, but likely "-9"), Quality empty
    // The code sets chordBase = "-" if 3min is present. Then if 7min is present, it adds "7" or "9".
    // So it should be "-9".
    if (result3.root.data[0] === 0 && (result3.base === "-9" || result3.base === "min9") && !result3.quality.includes("9")) {
        console.log("PASS: Correctly identified as Cm9");
    } else {
        console.log("FAIL: Identified as " + result3.root.data[0] + result3.base + result3.quality.join("") + result3.inversion);
    }

}

test9thChordRanking();


import { analyzeChord } from "./chord";
import { positionVector } from "./positionVector";
import { scaleNames } from "./chord";

function debugInversion() {
    console.log("Debugging Inversion Issue...");

    // Create a chord that might trigger the issue.
    // We need a case where the bass note of the inversion is considered an extension of the "candidate" analysis
    // and thus removed.

    // Example: Cmaj7/B (B C E G) -> B is the bass.
    // Sorted: C E G B (0, 4, 7, 11)
    // Rotation to B bass: B C E G (11, 12, 16, 19)
    // Root of candidate might be C.
    // Is B (11) an extension of C major? Yes, major 7th.
    // If logic removes it, we lose the bass.

    // Let's try constructing Cmaj7/B
    // C=0, E=4, G=7, B=11.
    // Input vector: [11, 0, 4, 7] (B at bottom)
    const cmaj7_b = new positionVector([11, 0, 4, 7], 12, 12);

    console.log("Analyzing Cmaj7/B (expecting /B or similar)...");
    const result = analyzeChord(cmaj7_b, true);

    console.log("Result:");
    console.log("Root:", scaleNames(result.root));
    console.log("Base:", result.base);
    console.log("Quality:", result.quality);
    console.log("Inversion:", result.inversion);

    // Check if inversion string contains "B"
    if (result.inversion.includes("B") || result.inversion.includes("Si")) {
        console.log("PASS: Inversion seems correct.");
    } else {
        console.log("FAIL: Inversion is incorrect.");
    }

    // Another case: G/A (A G B D) -> A11? or G add9 / A?
    // A=9, G=7, B=11, D=2.
    // Sorted: G B D A (7, 11, 14, 21) -> G A B D (7, 9, 11, 14)
    // Rotations...
    // Let's try G/A input: [9, 7, 11, 2]
    const g_over_a = new positionVector([9, 7, 11, 2], 12, 12);
    console.log("\nAnalyzing G/A...");
    const result2 = analyzeChord(g_over_a, true);
    console.log("Inversion:", result2.inversion);

}

debugInversion();

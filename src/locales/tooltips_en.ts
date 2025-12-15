export const TOOLTIPS_EN = {
    // ROOT
    root: {
        title: "Root (R)",
        description: "It is the generating note of the chord, the reference point from which all other intervals are calculated. It defines the tonality of the harmonic center."
    },

    // INTERVAL 1: b2 / b9
    b9_dom: {
        title: "Minor Ninth (b9)",
        description: "Altered tension typical of dominant chords. Resolves down by a semitone to the 5th of the resolution chord (e.g., b9 -> 5). Adds a dark and dramatic character."
    },
    b2_phryg: {
        title: "Minor Second (b2)",
        description: "Characteristic interval of the Phrygian mode. In a modal context, it is not necessarily a tension to resolve, but a dark and 'Spanish' color."
    },
    b9_dim: {
        title: "Minor Ninth (b9)",
        description: "In a diminished chord (which can function as a rootless dominant b9), this note is an integral part of the symmetric structure."
    },

    // INTERVAL 2: 2 / 9
    sus2: {
        title: "Sus 2",
        description: "Replaces the third, creating a 'suspended' chord. It lacks major/minor definition, creating an open and floating sound that often resolves to the root or third."
    },
    maj9: {
        title: "Major Ninth (9)",
        description: "Natural extension of the chord. Adds color and richness without altering the function (unlike b9 or #9). Very common in jazz and sophisticated pop."
    },
    add9: {
        title: "Added Ninth (add9)",
        description: "Inserted into a simple triad (without seventh). Adds a sweet and nostalgic sonority, typical of pop and some contemporary folk music."
    },

    // INTERVAL 3: b3 / #9
    min3: {
        title: "Minor Third (b3)",
        description: "Defines the MINOR mode. It is the fundamental interval that determines the 'sad' or introspective character of the chord."
    },
    sharp9: {
        title: "Augmented Ninth (#9)",
        description: "The quintessential 'Blues' note. Enharmonically a minor third, but on a chord with a major third (Dominant) it creates strong friction (cross-relation). Famous in the 'Hendrix chord' (7#9)."
    },

    // INTERVAL 4: 3
    maj3: {
        title: "Major Third (3)",
        description: "Defines the MAJOR mode. Bright and stable interval that, together with the root, immediately clarifies the tonality."
    },
    dim4: {
        title: "Diminished Fourth (dim4)",
        description: "Enharmonically a Major Third. Theoretically found in rare chords or very chromatic voice leading contexts. (To be defined better based on context)."
    },

    // INTERVAL 5: 4 / 11
    sus4: {
        title: "Sus 4",
        description: "Replaces the third. Creates a tension that demands resolution towards the third (4->3). Very common in cadences."
    },
    p4_avoid: {
        title: "Perfect Fourth (Avoid Note)",
        description: "On a Maj7 chord, the perfect 4th creates a harsh dissonance (b9) with the major 3rd. Usually avoided or raised to #11, unless it's a desired effect or a pedal point."
    },
    p11_min: {
        title: "Eleventh (11)",
        description: "On minor chords, the eleventh is a very common and pleasing extension ('Dorian sound'). It does not conflict with the minor third."
    },
    p11_dom: {
        title: "Eleventh (11)",
        description: "On dominant chords, the natural eleventh is often used in 'sus' contexts or as melodic passing tension, otherwise it tends to 'muddy' the major third."
    },

    // INTERVAL 6: b5 / #11
    dim5: {
        title: "Diminished Fifth (b5)",
        description: "Key interval of diminished and half-diminished chords. Divides the octave deeply (Tritone), creating instability and a need for movement."
    },
    sharp11_lyd: {
        title: "Augmented Eleventh (#11)",
        description: "Characteristic of the Lydian mode. On a Major chord, it removes the dissonance of the perfect 4th and evokes dreamlike, spatial, and modern sonorities."
    },
    sharp11_dom: {
        title: "Augmented Eleventh (#11)",
        description: "On a dominant chord (Lydian Dominant), it adds brightness and pushes towards unconventional resolutions. Typical 'Simpson' sound (intro)."
    },
    alt_b5: {
        title: "Altered Fifth (b5)",
        description: "Often used in 'Altered' chords (Superlocrian). Can be seen as enharmonic to #11, but in descending or altered contexts is often indicated as a lowering of the fifth."
    },

    // INTERVAL 7: 5
    perf5: {
        title: "Perfect Fifth (5)",
        description: "Pillar of stability. Reinforces the root and, in dyads (power chords), creates a powerful but ambiguous sound (neither major nor minor)."
    },

    // INTERVAL 8: #5 / b13 / b6
    aug5: {
        title: "Augmented Fifth (#5)",
        description: "Generates the Augmented chord. Creates a 'suspended' and dreamlike tension that wants to expand upwards (e.g., resolving to the 3rd of the next chord or moving the voice)."
    },
    b6_min: {
        title: "Minor Sixth (b6)",
        description: "On a minor chord, evokes the Aeolian mode or Harmonic Minor scale. Very dramatic, almost 'cinematic' (love theme, suspense)."
    },
    b13_dom: {
        title: "Minor Thirteenth (b13)",
        description: "Altered tension very common on dominant chords (V7b13). Often accompanies the b9 to resolve strongly to a minor or major chord."
    },

    // INTERVAL 9: 6 / 13 / bb7
    maj6: {
        title: "Major Sixth (6)",
        description: "Adds 'warm' stability. On major chords it is pastoral/reassuring; on minor it is the typical 'Dorian' color (e.g., Santana, Modal Jazz)."
    },
    maj13: {
        title: "Thirteenth (13)",
        description: "The highest extension. Includes all previous notes. On a dominant chord, the natural 13 (without alterations) creates a sophisticated and 'pianistic' sound."
    },
    dim7: {
        title: "Diminished Seventh (bb7)",
        description: "Enharmonically a Major Sixth. It is the note that defines the Diminished 7th chord (essentially a rootless dominant b9). Symmetric and unstable."
    },

    // INTERVAL 10: b7
    min7_dom: {
        title: "Minor Seventh (b7)",
        description: "Fundamental 'guide' note. Together with the major 3rd it forms the Tritone, the 'engine' that moves tonal music towards resolution. Defines the Dominant function."
    },
    min7_min: {
        title: "Minor Seventh (b7)",
        description: "Makes the minor triad softer and 'jazzier'. It is a chord of relative rest (m7) or movement (ii in ii-V-I)."
    },
    aug6: {
        title: "Augmented Sixth (aug6)",
        description: "Enharmonically a b7. Used in classical contexts (Augmented Sixth Chords: Italian, French, German) to expand the interval towards the octave. (To be defined context)."
    },

    // INTERVAL 11: 7
    maj7: {
        title: "Major Seventh (Maj7)",
        description: "Creates a very sweet dissonance with the root. It is the sound of 'sophisticated rest', typical of jazz, bossa nova, and refined pop."
    },
    dim_maj7: {
        title: "Major Seventh (on Minor)",
        description: " 'Minor-Major' chord (m(Maj7)). The typical 'spy movie' or 'film noir' chord. Very mysterious and tense, a cliché ending in minor songs."
    },

    // GENERIC
    unknown: {
        title: "Interval",
        description: "Complex or chromatic analysis - Specific role in this voicing to be defined."
    }
};

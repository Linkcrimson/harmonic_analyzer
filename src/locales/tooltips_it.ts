export const TOOLTIPS_IT = {
    // ROOT
    root: {
        title: "Fondamentale (R)",
        description: "È la nota generatrice dell'accordo, il punto di riferimento da cui vengono calcolati tutti gli altri intervalli. Definisce la tonalità del centro armonico."
    },

    // INTERVAL 1: b2 / b9
    b9_dom: {
        title: "Nona Minore (b9)",
        description: "Tensione alterata tipica degli accordi di dominante. Risolve scendendo di semitono sulla 5a dell'accordo di risoluzione (es. b9 -> 5). Conferisce un carattere scuro e drammatico."
    },
    b2_phryg: {
        title: "Seconda Minore (b2)",
        description: "Intervallo caratteristico del modo Frigio. In un contesto modale, non è necessariamente una tensione da risolvere, ma un colore scuro e 'spagnoleggiante'."
    },
    b9_dim: {
        title: "Nona Minore (b9)",
        description: "In un accordo diminuito (che può fungere da dominante b9 senza radice), questa nota è parte integrante della struttura simmetrica."
    },

    // INTERVAL 2: 2 / 9
    sus2: {
        title: "Sus 2",
        description: "Sostituisce la terza, creando un accordo 'sospeso'. Manca la definizione maggiore/minore, creando un suono aperto e fluttuante che spesso risolve sulla tonica o sulla terza."
    },
    maj9: {
        title: "Nona Maggiore (9)",
        description: "Estensione naturale dell'accordo. Aggiunge colore e ricchezza senza alterare la funzione (a differenza della b9 o #9). Molto comune nel jazz e nel pop sofisticato."
    },
    add9: {
        title: "Nona Aggiunta (add9)",
        description: "Inserita in una triade semplice (senza settima). Conferisce una sonorità dolce e nostalgica, tipica del pop e di certa musica folk contemporanea."
    },

    // INTERVAL 3: b3 / #9
    min3: {
        title: "Terza Minore (b3)",
        description: "Definisce il modo MINORE. È l'intervallo fondamentale che determina il carattere 'triste' o introspettivo dell'accordo."
    },
    sharp9: {
        title: "Nona Aumentata (#9)",
        description: "Nota 'Blues' per eccellenza. Enarmonicamente è una terza minore, ma su un accordo con terza maggiore (Dominante) crea un forte attrito (cross-relation). Celebre nell'accordo 'Hendrix' (7#9)."
    },

    // INTERVAL 4: 3
    maj3: {
        title: "Terza Maggiore (3)",
        description: "Definisce il modo MAGGIORE. Intervallo brillante e stabile che, insieme alla fondamentale, chiarisce immediatamente la tonalità."
    },
    dim4: {
        title: "Quarta Diminuita (dim4)",
        description: "Enarmonicamente una Terza Maggiore. Si trova teoricamente in accordi rari o contesti di conduzione delle voci molto cromatici. (Da definire meglio in base al contesto specifico)."
    },

    // INTERVAL 5: 4 / 11
    sus4: {
        title: "Sus 4",
        description: "Sostituisce la terza. Crea una tensione che chiede risoluzione verso la terza (4->3). Molto comune nelle cadenze."
    },
    p4_avoid: {
        title: "Quarta Giusta (Avoid Note)",
        description: "Su un accordo Maj7, la 4a giusta crea una dissonanza aspra (b9) con la 3a maggiore. Solitamente si evita o si alza a #11, a meno che non sia un effetto voluto o un pedale."
    },
    p11_min: {
        title: "Undicesima (11)",
        description: "Su accordi minori, l'undicesima è una estensione molto comune e gradevole (suono Dorian). Non entra in conflitto con la terza minore."
    },
    p11_dom: {
        title: "Undicesima (11)",
        description: "Su accordi di dominante, l'undicesima naturale è spesso usata in contesti 'sus' o come tensione melodica di passaggio, altrimenti tende a 'sporcare' la terza maggiore."
    },

    // INTERVAL 6: b5 / #11
    dim5: {
        title: "Quinta Diminuita (b5)",
        description: "Intervallo chiave degli accordi diminuiti e semidiminuiti. Divide l'ottava a metà (Tritono), creando instabilità e necessità di movimento."
    },
    sharp11_lyd: {
        title: "Undicesima Aumentata (#11)",
        description: "Caratteristica del modo Lidio. Su un accordo Major, toglie la dissonanza della 4a giusta ed evoca sonorità oniriche, spaziali e moderne."
    },
    sharp11_dom: {
        title: "Undicesima Aumentata (#11)",
        description: "Su un accordo di dominante (Lydian Dominant), aggiunge brillantezza e spinge verso risoluzioni non convenzionali. Tipico suono 'Simpson' (intro)."
    },
    alt_b5: {
        title: "Quinta Alterata (b5)",
        description: "Spesso usata in accordi 'Altered' (Superlocri). Può essere vista come enarmonica della #11, ma in contesti discendenti o alterati spesso si indica come abbassamento della quinta."
    },

    // INTERVAL 7: 5
    perf5: {
        title: "Quinta Giusta (5)",
        description: "Pilastro della stabilità. Rinforza la fondamentale e, nei bicordi (power chords), crea un suono potente ma ambiguo (né maggiore né minore)."
    },

    // INTERVAL 8: #5 / b13 / b6
    aug5: {
        title: "Quinta Aumentata (#5)",
        description: "Genera l'accordo Aumentato. Crea una tensione 'sospesa' e onirica che desidera espandersi verso l'alto (es. risolvendo sulla 3a dell'accordo successivo o muovendo la voce)."
    },
    b6_min: {
        title: "Sesta Minore (b6)",
        description: "Su un accordo minore, evoca il modo Eolio o la scala Minore Armonica. Molto drammatica, quasi 'cinematografica' (tema d'amore, suspense)."
    },
    b13_dom: {
        title: "Tredicesima Minore (b13)",
        description: "Tensione alterata molto comune sugli accordi di dominante (V7b13). Spesso accompagna la b9 per risolvere in modo forte su un accordo minore o maggiore."
    },

    // INTERVAL 9: 6 / 13 / bb7
    maj6: {
        title: "Sesta Maggiore (6)",
        description: "Aggiunge stabilità 'calda'. Su accordo maggiore è pastorale/rassicurante; su minore è il tipico colore 'Dorian' (es. Santana, Jazz modale)."
    },
    maj13: {
        title: "Tredicesima (13)",
        description: "L'estensione più alta. Comprende tutte le note precedenti. Su un accordo di dominante, la 13 naturale (senza alterazioni) crea un suono sofisticato e 'pianistico'."
    },
    dim7: {
        title: "Sesta / Settima Diminuita",
        description: "Intervallo enarmonico: sesta maggiore e settima diminuita (bb7) sono lo stesso tasto. In accordi come C6 o Cm6, la sesta prende la funzione della settima ma resta una CONSONANZA (suono stabile, caldo, Dorico). In accordi diminuiti (°7), è una dissonanza che definisce la struttura simmetrica. A differenza di m7 e Maj7 (dissonanze), la sesta non crea tensione da risolvere."
    },
    dim7_true: {
        title: "Settima Diminuita (bb7)",
        description: "In un accordo diminuito (°7), questa nota definisce la struttura simmetrica. L'accordo dim7 divide l'ottava in quattro parti uguali, creando instabilità e ambiguità tonale. Funziona come dominante senza fondamentale (b9 implicita). Suono drammatico e misterioso."
    },
    sixth_min: {
        title: "Sesta (in accordo minore)",
        description: "Il sistema cerca una settima e la trova in questa settima diminuita, enarmonica alla sesta maggiore. In un accordo minore con sesta (es. Cm6), questa nota è una consonanza che aggiunge calore Dorico. Non crea tensione da risolvere come le settime. Suono tipico di Santana, jazz modale, e atmosfere 'soul'."
    },
    sixth_maj: {
        title: "Sesta (in accordo maggiore)",
        description: "Il sistema cerca una settima e la trova in questa settima diminuita, enarmonica alla sesta maggiore. In un accordo maggiore con sesta (es. C6), questa nota è una consonanza che conferisce un colore pastorale e rassicurante. Non crea tensione da risolvere. Tipica del jazz classico, swing e 'easy listening'."
    },

    // INTERVAL 10: b7 / #13
    sharp13: {
        title: "Tredicesima Aumentata (#13)",
        description: "Quando la Settima Maggiore è già presente, questo intervallo (enarmonico della Settima Minore) assume la funzione di Tredicesima Aumentata. Crea un colore molto sofisticato e moderno, tipico del jazz contemporaneo."
    },
    min7_dom: {
        title: "Settima Minore (b7)",
        description: "Nota 'guida' fondamentale. Insieme alla 3a maggiore forma il Tritono, il 'motore' che fa muovere la musica tonale verso la risoluzione. Definisce la funzione di Dominante."
    },
    min7_min: {
        title: "Settima Minore (b7)",
        description: "Rende la triade minore più morbida e 'jazz'. È un accordo di riposo relativo (m7) o di movimento (ii nel ii-V-I)."
    },
    aug6: {
        title: "Sesta Aumentata (aug6)",
        description: "Enarmonicamente una b7. Usata in contesti classici (Accordi di Sesta Aumentata: Italiana, Francese, Tedesca) per espandere l'intervallo verso l'ottava. (Da definire il contesto)."
    },

    // INTERVAL 11: 7
    maj7: {
        title: "Settima Maggiore (Maj7)",
        description: "Crea una dissonanza molto dolce con la fondamentale. È il suono del 'riposo sofisticato', tipico del jazz, della bossa nova e del pop raffinato."
    },
    dim_maj7: {
        title: "Settima Maggiore (su Minore)",
        description: "Accordo 'Minore-Maggiore' (m(Maj7)). Il tipico accordo 'spy movie' o 'film noir'. Molto misterioso e tensivo, clichè finale nei brani minori."
    },

    // GENERIC
    unknown: {
        title: "Intervallo",
        description: "Analisi complessa o cromatica - Da definire il ruolo specifico in questo voicing."
    },

    // ADD EXTENSIONS (no seventh present)
    addb9: {
        title: "Nona Minore Aggiunta (add b9)",
        description: "Nona minore aggiunta a una triade (senza settima). Crea una tensione molto intensa e un colore oscuro, tipico di sonorità cinematografiche o drammatiche."
    },
    addsharp9: {
        title: "Nona Aumentata Aggiunta (add #9)",
        description: "Nona aumentata aggiunta a una triade (senza settima). Crea un effetto 'blues' anche senza la settima dominante. Raro ma suggestivo."
    },
    add11: {
        title: "Undicesima Aggiunta (add11)",
        description: "Undicesima aggiunta a una triade (senza settima). Crea un suono aperto e sospeso, simile a un sus4 ma con la terza presente. Tipico del rock e del pop."
    },
    addsharp11: {
        title: "Undicesima Aumentata Aggiunta (add #11)",
        description: "Undicesima aumentata aggiunta a una triade (senza settima). Evoca il modo Lidio anche senza la settima. Suono brillante e 'spaziale'."
    },
    addb13: {
        title: "Tredicesima Minore Aggiunta (add b13)",
        description: "Tredicesima minore aggiunta a una triade (senza settima). Crea una tensione dolce-amara tipica del minore armonico."
    },
    add13: {
        title: "Tredicesima Aggiunta (add13)",
        description: "Tredicesima aggiunta a una triade (senza settima). Equivale a un accordo di sesta, ma con una diversa implicazione funzionale. Suono dolce e nostalgico."
    },
    addsharp13: {
        title: "Tredicesima Aumentata Aggiunta (add #13)",
        description: "Tredicesima aumentata aggiunta a una triade (senza settima). Molto raro, crea un colore moderno e sofisticato."
    },

    // AUDIO MODES
    audio_modes: {
        short: "Percussivo",
        continuous: "Continuo",
        repeat: "Ripetuto",
        arpeggio: "Arpeggio"
    }
};

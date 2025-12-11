import React, { createContext, useContext, useState } from 'react';

export interface ChordNotationSettings {
    major: 'maj' | 'Δ';
    minor: 'min' | 'm' | '-';
    diminished: 'dim' | '°' | 'dynamic';
    augmented: 'aug' | '+';
    halfDiminished: 'ø' | 'dynamic';
    omit: 'omit' | 'no';
    accidental: 'b' | '♭';
}

export const DEFAULT_NOTATION_SETTINGS: ChordNotationSettings = {
    major: 'Δ',
    minor: '-',
    diminished: '°',
    augmented: '+',
    halfDiminished: 'ø',
    omit: 'omit',
    accidental: '♭'
};

interface NotationContextType {
    settings: ChordNotationSettings;
    updateSettings: (newSettings: Partial<ChordNotationSettings>) => void;
}

const NotationContext = createContext<NotationContextType | undefined>(undefined);

export const NotationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<ChordNotationSettings>(() => {
        const saved = localStorage.getItem('harmonic-notation-settings');
        if (saved) {
            try {
                return { ...DEFAULT_NOTATION_SETTINGS, ...JSON.parse(saved) };
            } catch (e) {
                console.error("Failed to parse notation settings", e);
            }
        }
        return DEFAULT_NOTATION_SETTINGS;
    });

    const updateSettings = (newSettings: Partial<ChordNotationSettings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem('harmonic-notation-settings', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <NotationContext.Provider value={{ settings, updateSettings }}>
            {children}
        </NotationContext.Provider>
    );
};

export const useNotation = () => {
    const context = useContext(NotationContext);
    if (context === undefined) {
        throw new Error('useNotation must be used within a NotationProvider');
    }
    return context;
};

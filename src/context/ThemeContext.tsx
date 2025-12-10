import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'alchemy' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'high_contrast' | 'custom';

interface CustomColors {
    root: string;
    third: string;
    fifth: string;
    seventh: string;
    ext: string;
}

const DEFAULT_CUSTOM_COLORS: CustomColors = {
    root: '#81c784',
    third: '#64b5f6',
    fifth: '#e57373',
    seventh: '#ffd54f',
    ext: '#ba68c8',
};

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    customColors: CustomColors;
    setCustomColors: (colors: CustomColors) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        const saved = localStorage.getItem('harmonic-theme');
        // Migrate legacy 'colorblind' to 'deuteranopia'
        if (saved === 'colorblind') return 'deuteranopia';
        return (saved as Theme) || 'alchemy';
    });

    const [customColors, setCustomColorsState] = useState<CustomColors>(() => {
        const saved = localStorage.getItem('harmonic-custom-colors');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse custom colors", e);
            }
        }
        return DEFAULT_CUSTOM_COLORS;
    });

    useEffect(() => {
        localStorage.setItem('harmonic-theme', theme);
        document.documentElement.setAttribute('data-theme', theme);

        if (theme === 'custom') {
            document.documentElement.style.setProperty('--col-root', customColors.root);
            document.documentElement.style.setProperty('--col-third', customColors.third);
            document.documentElement.style.setProperty('--col-fifth', customColors.fifth);
            document.documentElement.style.setProperty('--col-seventh', customColors.seventh);
            document.documentElement.style.setProperty('--col-ext', customColors.ext);
        } else {
            // Remove inline styles to let CSS classes take over
            document.documentElement.style.removeProperty('--col-root');
            document.documentElement.style.removeProperty('--col-third');
            document.documentElement.style.removeProperty('--col-fifth');
            document.documentElement.style.removeProperty('--col-seventh');
            document.documentElement.style.removeProperty('--col-ext');
        }
    }, [theme, customColors]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    const setCustomColors = (newColors: CustomColors) => {
        setCustomColorsState(newColors);
        localStorage.setItem('harmonic-custom-colors', JSON.stringify(newColors));
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, customColors, setCustomColors }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

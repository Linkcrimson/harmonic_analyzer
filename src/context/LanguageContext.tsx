import React, { createContext, useContext, useState, useEffect } from 'react';
import it from '../locales/it.json';
import en from '../locales/en.json';

// --- Costanti per Scalabilità ---
export const SUPPORTED_LANGUAGES = {
    it: 'Italiano',
    en: 'English'
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

// Mappa delle traduzioni
const translations: Record<LanguageCode, any> = {
    it,
    en
};

// --- Context Definition ---
interface LanguageContextType {
    language: LanguageCode;
    setLanguage: (lang: LanguageCode) => void;
    t: (path: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// --- Helper Functions ---
const getBrowserLanguage = (): LanguageCode => {
    const browserLang = navigator.language.split('-')[0];
    if (browserLang in SUPPORTED_LANGUAGES) {
        return browserLang as LanguageCode;
    }
    return 'en'; // Fallback
};

// --- Provider Component ---
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<LanguageCode>('en'); // Default temporaneo

    useEffect(() => {
        // 1. Check localStorage
        const savedLang = localStorage.getItem('app-language') as LanguageCode;

        if (savedLang && SUPPORTED_LANGUAGES[savedLang]) {
            setLanguageState(savedLang);
        } else {
            // 2. Detect Browser Language
            setLanguageState(getBrowserLanguage());
        }
    }, []);

    const setLanguage = (lang: LanguageCode) => {
        setLanguageState(lang);
        localStorage.setItem('app-language', lang);
        // Opzionale: aggiornare l'attributo lang dell'HTML per accessibilità/SEO
        document.documentElement.lang = lang;
    };

    // Funzione di traduzione semplice (supporta 'dot.notation')
    const t = (path: string): string => {
        const keys = path.split('.');
        let current: any = translations[language];

        for (const key of keys) {
            if (current[key] === undefined) {
                console.warn(`Missing translation for key: ${path} in language: ${language}`);
                // Fallback a inglese se manca la chiave in lingua corrente
                if (language !== 'en') {
                    let fallback = translations['en'];
                    for (const fKey of keys) {
                        if (fallback[fKey] === undefined) return path;
                        fallback = fallback[fKey];
                    }
                    return fallback;
                }
                return path;
            }
            current = current[key];
        }
        return typeof current === 'string' ? current : path;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

// --- Hook ---
export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

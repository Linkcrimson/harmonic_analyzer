import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../../context/LanguageContext';

export const MetaManager: React.FC = () => {
    const { language } = useLanguage();

    // Map internal language codes to standard ISO codes if necessary
    // Currently 'it' and 'en' are standard enough
    const title = language === 'it' ? 'Analizzatore Armonico' : 'Chord Analyzer';
    const description = language === 'it'
        ? 'Strumento avanzato di analisi musicale e teoria armonica'
        : 'Advanced music theory analysis tool';

    return (
        <Helmet>
            <html lang={language} />
            <title>{title}</title>
            <meta name="description" content={description} />
        </Helmet>
    );
};

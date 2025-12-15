import React from 'react';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '../context/LanguageContext';

export const LanguageTab: React.FC = () => {
    const { language, setLanguage, t } = useLanguage();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                    {t('language.select')}
                </label>
                <div className="grid grid-cols-1 gap-3">
                    {(Object.entries(SUPPORTED_LANGUAGES) as [LanguageCode, string][]).map(([code, label]) => (
                        <button
                            key={code}
                            onClick={() => setLanguage(code)}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left ${language === code
                                    ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                    : 'bg-[#222] border-[#333] hover:border-gray-500'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {/* Bandierina o icona opzionale */}
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${language === code ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
                                    }`}>
                                    {code.toUpperCase()}
                                </div>
                                <span className={`font-medium ${language === code ? 'text-white' : 'text-gray-300'}`}>
                                    {label}
                                </span>
                            </div>

                            {language === code && (
                                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Debug Info (Opzionale, solo per dev) */}
            <div className="mt-8 p-4 bg-gray-900/50 rounded-lg text-xs font-mono text-gray-500">
                Current Locale: {language}
            </div>
        </div>
    );
};

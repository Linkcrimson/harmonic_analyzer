import React from 'react';
import ReactDOM from 'react-dom';
import { useLanguage } from '../context/LanguageContext';
import { LanguageTab } from './LanguageTab';
import { ThemeSettings } from './Settings/ThemeSettings';
import { InputSettings } from './Settings/InputSettings';
import { AppSettings } from './Settings/AppSettings';
import { NotationSettings } from './Settings/NotationSettings';


interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = React.useState<'appearance' | 'input' | 'install' | 'notation' | 'language'>('input');
    const modalRef = React.useRef<HTMLDivElement>(null);

    // [EAA FIX] Focus Trap
    React.useEffect(() => {
        if (!isOpen) return;

        const modalElement = modalRef.current;
        if (!modalElement) return;

        // Focus the first focusable element on open
        const focusableElements = modalElement.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (firstElement) firstElement.focus();

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) { // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else { // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleTabKey);
        window.addEventListener('keydown', handleEsc);

        return () => {
            window.removeEventListener('keydown', handleTabKey);
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
        >
            <div
                ref={modalRef}
                className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 w-full max-w-md shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 id="settings-title" className="text-xl font-bold text-white">{t('settings.title')}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label={t('settings.close') || 'Chiudi'}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tab Navigation */}
                <div
                    className="flex border-b border-[#333] mb-4 overflow-x-auto custom-scrollbar-hide"
                    role="tablist"
                    aria-label={t('settings.title')}
                >
                    <button
                        role="tab"
                        aria-selected={activeTab === 'input'}
                        aria-controls="panel-settings"
                        id="tab-input"
                        className={`flex-none px-4 pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'input' ? 'text-white' : 'text-gray-400 hover:text-gray-300'}`}
                        onClick={() => setActiveTab('input')}
                    >
                        {t('settings.input')}
                        {activeTab === 'input' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></div>
                        )}
                    </button>
                    <button
                        role="tab"
                        aria-selected={activeTab === 'notation'}
                        aria-controls="panel-settings"
                        id="tab-notation"
                        className={`flex-none px-4 pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'notation' ? 'text-white' : 'text-gray-400 hover:text-gray-300'}`}
                        onClick={() => setActiveTab('notation')}
                    >
                        {t('settings.notation')}
                        {activeTab === 'notation' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></div>
                        )}
                    </button>
                    <button
                        role="tab"
                        aria-selected={activeTab === 'appearance'}
                        aria-controls="panel-settings"
                        id="tab-appearance"
                        className={`flex-none px-4 pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'appearance' ? 'text-white' : 'text-gray-400 hover:text-gray-300'}`}
                        onClick={() => setActiveTab('appearance')}
                    >
                        {t('settings.theme')}
                        {activeTab === 'appearance' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></div>
                        )}
                    </button>
                    <button
                        role="tab"
                        aria-selected={activeTab === 'language'}
                        aria-controls="panel-settings"
                        id="tab-language"
                        className={`flex-none px-4 pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'language' ? 'text-white' : 'text-gray-400 hover:text-gray-300'}`}
                        onClick={() => setActiveTab('language')}
                    >
                        {t('settings.language')}
                        {activeTab === 'language' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></div>
                        )}
                    </button>
                    <button
                        role="tab"
                        aria-selected={activeTab === 'install'}
                        aria-controls="panel-settings"
                        id="tab-install"
                        className={`flex-none px-4 pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'install' ? 'text-white' : 'text-gray-400 hover:text-gray-300'}`}
                        onClick={() => setActiveTab('install')}
                    >
                        {t('settings.app')}
                        {activeTab === 'install' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></div>
                        )}
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div
                    className="overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar"
                    id="panel-settings"
                    role="tabpanel"
                    aria-labelledby={`tab-${activeTab}`}
                >
                    {activeTab === 'language' && <LanguageTab />}
                    {activeTab === 'appearance' && <ThemeSettings />}
                    {activeTab === 'input' && <InputSettings />}
                    {activeTab === 'install' && <AppSettings />}
                    {activeTab === 'notation' && <NotationSettings />}
                </div>
            </div>
        </div>,
        document.body
    );
};



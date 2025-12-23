import React from 'react';
import { HarmonicProvider } from './context/HarmonicContext';
import { ThemeProvider } from './context/ThemeContext';
import { PWAProvider } from './context/PWAContext';
import { NotationProvider } from './context/NotationContext';
import { LanguageProvider } from './context/LanguageContext';
import { AnalysisView } from './components/Analysis/AnalysisView';
import { Controls } from './components/Controls';
import { Piano } from './components/Piano/Piano';
import { UpdateManager } from './components/UpdateManager';
import { AppToolbar } from './components/AppToolbar';
import { MetaManager } from './components/SEO/MetaManager';
import { PlaybackPanel } from './components/Analysis/PlaybackPanel';

const AppContent: React.FC = () => {
    const pianoScrollRef = React.useRef<HTMLDivElement>(null);
    const [viewMode, setViewMode] = React.useState<'circle' | 'cards'>('circle');
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

    return (
        <main className="w-full max-w-7xl flex flex-col">
            {/* Toolbar - Full Width, Centered, above columns */}
            <AppToolbar
                viewMode={viewMode}
                setViewMode={setViewMode}
                isSettingsOpen={isSettingsOpen}
                setIsSettingsOpen={setIsSettingsOpen}
            />

            <div className="p-2 md:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-6 lg:gap-8 pb-[360px] lg:pb-6">
                {/* Left Column: Analysis (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-3 md:gap-6">
                    <AnalysisView viewMode={viewMode} />
                </div>

                {/* Right Column: Keyboard & Controls (7 cols) */}
                <div className="fixed bottom-0 left-0 right-0 z-50 lg:relative lg:col-span-7 flex flex-col bg-[#111] rounded-t-3xl lg:rounded-3xl border-t lg:border border-[#222] p-4 pb-0 lg:p-8 min-h-0 lg:h-auto shadow-[0_-10px_40px_rgba(0,0,0,0.5)] lg:shadow-none">
                    {/* Background Decoration */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-purple-900/10 pointer-events-none"></div>

                    <div className="w-full relative z-50">
                        <Controls scrollContainerRef={pianoScrollRef} />
                    </div>

                    {/* Center Piano vertically in the remaining space */}
                    <div className="flex-1 lg:flex-none flex items-start justify-center w-full mt-4 lg:mt-0">
                        <Piano ref={pianoScrollRef} />
                    </div>

                    {/* Contextual Audio Panel (Below Keyboard) */}
                    <div className="w-full relative z-40">
                        <PlaybackPanel />
                    </div>
                </div>
            </div>
        </main>
    );
};

export const App: React.FC = () => {
    return (
        <ThemeProvider>
            <NotationProvider>
                <HarmonicProvider>
                    <PWAProvider>
                        <LanguageProvider>
                            <MetaManager />
                            <div className="min-h-screen flex flex-col items-center bg-[#0a0a0a] text-[#e0e0e0]">
                                <UpdateManager />
                                <AppContent />
                            </div>
                        </LanguageProvider>
                    </PWAProvider>
                </HarmonicProvider>
            </NotationProvider>
        </ThemeProvider>
    );
};

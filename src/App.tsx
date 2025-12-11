import React from 'react';
import { HarmonicProvider } from './context/HarmonicContext';
import { ThemeProvider } from './context/ThemeContext';
import { PWAProvider } from './context/PWAContext';
import { AnalysisView } from './components/Analysis/AnalysisView';
import { Controls } from './components/Controls';
import { Piano } from './components/Piano/Piano';
import { UpdateManager } from './components/UpdateManager';

const AppContent: React.FC = () => {
    const pianoScrollRef = React.useRef<HTMLDivElement>(null);

    return (
        <main className="w-full max-w-7xl p-2 md:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-6 lg:gap-8 pb-[360px] lg:pb-6">
            {/* Left Column: Analysis (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-3 md:gap-6">
                <AnalysisView />
            </div>

            {/* Right Column: Keyboard & Controls (7 cols) */}
            <div className="fixed bottom-0 left-0 right-0 z-50 lg:relative lg:col-span-7 flex flex-col bg-[#111] rounded-t-3xl lg:rounded-3xl border-t lg:border border-[#222] p-4 pb-2 lg:p-8 overflow-hidden min-h-0 lg:min-h-[500px] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] lg:shadow-none">
                {/* Background Decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-purple-900/10 pointer-events-none"></div>

                <div className="w-full">
                    <Controls scrollContainerRef={pianoScrollRef} />
                </div>

                {/* Center Piano vertically in the remaining space, but biased towards top to match circle */}
                <div className="flex-1 flex items-start justify-center w-full mt-4 lg:mt-24">
                    <Piano ref={pianoScrollRef} />
                </div>
            </div>
        </main>
    );
};

export const App: React.FC = () => {
    return (
        <ThemeProvider>
            <HarmonicProvider>
                <PWAProvider>
                    <div className="min-h-screen flex flex-col items-center p-2 md:p-4 bg-[#0a0a0a] text-[#e0e0e0]">
                        <UpdateManager />
                        <AppContent />
                    </div>
                </PWAProvider>
            </HarmonicProvider>
        </ThemeProvider>
    );
};

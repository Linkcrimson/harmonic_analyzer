import React from 'react';
import { HarmonicProvider } from './context/HarmonicContext';
import { AnalysisView } from './components/Analysis/AnalysisView';
import { Controls } from './components/Controls';
import { Piano } from './components/Piano/Piano';

const AppContent: React.FC = () => {
    return (
        <main className="w-full max-w-7xl p-2 md:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-6 lg:gap-8">
            {/* Left Column: Analysis (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-3 md:gap-6">
                <AnalysisView />
            </div>

            {/* Right Column: Keyboard & Controls (7 cols) */}
            <div className="lg:col-span-7 flex flex-col bg-[#111] rounded-3xl border border-[#222] p-2 lg:p-8 relative overflow-hidden min-h-[350px] lg:min-h-[500px]">
                {/* Background Decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-purple-900/10 pointer-events-none"></div>

                <div className="w-full">
                    <Controls />
                </div>

                {/* Center Piano vertically in the remaining space, but biased towards top to match circle */}
                <div className="flex-1 flex items-start justify-center w-full mt-4 lg:mt-24">
                    <Piano />
                </div>
            </div>
        </main>
    );
};

export const App: React.FC = () => {
    return (
        <HarmonicProvider>
            <div className="min-h-screen flex flex-col items-center p-2 md:p-4 bg-[#0a0a0a] text-[#e0e0e0]">
                <AppContent />
            </div>
        </HarmonicProvider>
    );
};

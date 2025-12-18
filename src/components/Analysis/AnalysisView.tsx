import React from 'react';
import { HarmonicCircle } from './HarmonicCircle';
import { ChordHeader } from './ChordHeader';
import { AnalysisGrid } from './AnalysisGrid';
import { ChordAlternatives } from './ChordAlternatives';

interface AnalysisViewProps {
    viewMode: 'circle' | 'cards';
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ viewMode }) => {
    return (
        <div className="flex flex-col gap-4 md:gap-6 relative h-full">
            {/* Main Content Area */}
            {viewMode === 'circle' ? (
                /* CIRCLE MODE LAYOUT */
                <div className="flex flex-col gap-6 items-center">
                    <div className="w-full max-w-[360px] md:max-w-[420px] aspect-square flex justify-center items-center">
                        <HarmonicCircle />
                    </div>

                </div>
            ) : (
                /* CARDS MODE LAYOUT */
                <div className="flex flex-col px-1 md:px-0">
                    <ChordHeader />
                    <div className="mt-4">
                        <AnalysisGrid />
                    </div>
                </div>
            )}

            {/* Chord Alternatives (Shared Footer) */}
            <div className="mt-auto px-1 md:px-0 pt-4 border-t border-[#222]">
                <ChordAlternatives />
            </div>
        </div>
    );
};

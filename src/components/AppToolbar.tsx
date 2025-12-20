import React, { useState } from 'react';
import { Header } from './Header'; // Reusing Header for Title/MIDI
import { SettingsModal } from './SettingsModal';
import { TooltipInfo } from './Tooltip';
import { EnharmonicToggle } from './Toolbar/EnharmonicToggle';
import { BassToggle } from './Toolbar/BassToggle';
import { ViewToggle } from './Toolbar/ViewToggle';
import { SettingsToggle } from './Toolbar/SettingsToggle';

interface AppToolbarProps {
    viewMode: 'circle' | 'cards';
    setViewMode: (mode: 'circle' | 'cards') => void;
    isSettingsOpen: boolean;
    setIsSettingsOpen: (isOpen: boolean) => void;
}

export const AppToolbar: React.FC<AppToolbarProps> = ({
    viewMode,
    setViewMode,
    isSettingsOpen,
    setIsSettingsOpen
}) => {
    // State to coordinate tooltip exclusivity
    const [activeTooltip, setActiveTooltip] = useState<{
        type: 'enharmonic' | 'bass' | 'view' | 'settings',
        info: TooltipInfo
    } | null>(null);

    const closeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTouchRef = React.useRef(false);

    // Initial touch detection
    React.useEffect(() => {
        const handleTouch = () => { isTouchRef.current = true; };
        window.addEventListener('touchstart', handleTouch, { once: true });
        return () => window.removeEventListener('touchstart', handleTouch);
    }, []);

    // Click outside handler to close all tooltips on mobile interactions
    React.useEffect(() => {
        const closeAll = () => setActiveTooltip(null);
        window.addEventListener('scroll', closeAll, { capture: true });
        // Also close on background click for mobile responsiveness
        window.addEventListener('touchstart', (e) => {
            // If the tap is NOT on a tooltip or a trigger, close it
            if (!(e.target as HTMLElement).closest('.tooltip-trigger') && !(e.target as HTMLElement).closest('.tooltip-box')) {
                closeAll();
            }
        });

        return () => {
            window.removeEventListener('scroll', closeAll);
            window.removeEventListener('touchstart', () => { });
        };
    }, []);

    const clearCloseTimeout = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
    };

    const startCloseTimeout = () => {
        clearCloseTimeout();
        // On touch devices, we close faster/immediately if they tap away
        // On desktop, we keep the 300ms delay
        const delay = isTouchRef.current ? 50 : 300;
        closeTimeoutRef.current = setTimeout(() => {
            setActiveTooltip(null);
        }, delay);
    };

    // Shared handlers passed to children
    const handleOpenTooltip = (type: string, info: TooltipInfo) => {
        setActiveTooltip({ type: type as any, info });
    };

    const handleCloseTooltip = () => {
        setActiveTooltip(null);
    };


    return (
        <div className="w-full flex flex-col md:flex-row justify-center items-center gap-3 px-2 py-3 border-b border-[#222] bg-[#0a0a0a] relative z-[100]">
            <div className="w-full md:w-auto md:absolute md:left-4 flex justify-center md:block mb-1 md:mb-0">
                <Header />
            </div>

            {/* Centered Controls Group */}
            <div className="flex items-center gap-3">

                <EnharmonicToggle
                    activeTooltip={activeTooltip}
                    onOpenTooltip={handleOpenTooltip}
                    onCloseTooltip={handleCloseTooltip}
                    onCancelClose={clearCloseTimeout}
                    onScheduleClose={startCloseTimeout}
                />

                <BassToggle
                    activeTooltip={activeTooltip}
                    onOpenTooltip={handleOpenTooltip}
                    onCancelClose={clearCloseTimeout}
                    onScheduleClose={startCloseTimeout}
                />

                <ViewToggle
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    activeTooltip={activeTooltip}
                    onOpenTooltip={handleOpenTooltip}
                    onCancelClose={clearCloseTimeout}
                    onScheduleClose={startCloseTimeout}
                />

                <SettingsToggle
                    setIsSettingsOpen={setIsSettingsOpen}
                    activeTooltip={activeTooltip}
                    onOpenTooltip={handleOpenTooltip}
                    onCloseTooltip={handleCloseTooltip}
                    onCancelClose={clearCloseTimeout}
                    onScheduleClose={startCloseTimeout}
                />

                <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            </div>
        </div>
    );
};

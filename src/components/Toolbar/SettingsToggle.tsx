import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Tooltip, TooltipInfo } from '../Tooltip';

interface SettingsToggleProps {
    setIsSettingsOpen: (isOpen: boolean) => void;
    activeTooltip: { type: string; info: TooltipInfo } | null;
    onOpenTooltip: (type: string, info: TooltipInfo) => void;
    onCloseTooltip: () => void;
    onCancelClose: () => void;
    onScheduleClose: () => void;
}

export const SettingsToggle: React.FC<SettingsToggleProps> = ({
    setIsSettingsOpen,
    activeTooltip,
    onOpenTooltip,
    onCloseTooltip,
    onCancelClose,
    onScheduleClose
}) => {
    const { language } = useLanguage();

    const getContent = () => (
        <div className="text-[10px] text-gray-500">
            {language === 'it' ? "Preferenze MIDI, Audio e Aspetto" : "MIDI, Audio & Appearance Preferences"}
        </div>
    );

    return (
        <div
            className="relative tooltip-trigger"
            onMouseEnter={(e) => {
                onCancelClose();
                const rect = e.currentTarget.getBoundingClientRect();
                onOpenTooltip('settings', {
                    title: language === 'it' ? "IMPOSTAZIONI" : "SETTINGS",
                    content: null,
                    x: rect.left + (rect.width / 2),
                    y: rect.bottom,
                    containerWidth: rect.width,
                    clientY: e.clientY
                });
            }}
            onMouseLeave={onScheduleClose}
            onClick={() => {
                setIsSettingsOpen(true);
                onCloseTooltip();
            }}
            onTouchStart={(e) => {
                onCancelClose();
                const rect = e.currentTarget.getBoundingClientRect();
                onOpenTooltip('settings', {
                    title: language === 'it' ? "IMPOSTAZIONI" : "SETTINGS",
                    content: null,
                    x: rect.left + (rect.width / 2),
                    y: rect.bottom,
                    containerWidth: rect.width,
                    clientY: (e as unknown as React.TouchEvent).touches[0].clientY
                });
            }}
        >
            <div className="h-10 md:h-11 w-10 md:w-11 flex items-center justify-center rounded-xl bg-[#1a1a1a] border border-[#333] hover:bg-[#252525] hover:border-blue-500/50 text-gray-400 hover:text-white transition-all cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </div>
            {activeTooltip?.type === 'settings' && (
                <Tooltip
                    info={{ ...activeTooltip.info, content: getContent() }}
                    forcePosition="bottom"
                    onMouseEnter={onCancelClose}
                    onMouseLeave={onScheduleClose}
                />
            )}
        </div>
    );
};

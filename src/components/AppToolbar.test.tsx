import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppToolbar } from './AppToolbar';
// Now these are named exports
import { HarmonicContext } from '../context/HarmonicContext';
import { LanguageContext } from '../context/LanguageContext';

// Define initialAnalysis locally since it's just a default state structure
const mockAnalysis = {
    rootName: '--',
    quality: '--',
    stability: '--',
    function: '--',
    extensions: [],
    intervals: new Map(),
    noteNames: new Map(),
    flags: {
        isRootActive: false,
        isThirdActive: false,
        isFifthActive: false,
        isSeventhActive: false
    }
};

const mockHarmonicContext = {
    activeNotes: new Set(),
    analysis: mockAnalysis,
    holdingNotes: new Set(),
    isSustainActive: false,
    settings: {},
    isPlaying: false,
    volume: 0.5,
    forceBassAsRoot: false,
    checkEnharmonic: false,
    toggleBassAsRoot: vi.fn(),
    toggleEnharmonic: vi.fn(),
    toggleNote: vi.fn(),
    releaseAll: vi.fn(),
    setVolume: vi.fn(),
    startInput: vi.fn(),
    stopInput: vi.fn(),
};

const mockLanguageContext = {
    language: 'en',
    t: (key: string) => key,
    setLanguage: vi.fn(),
};

const renderToolbar = (props: any = {}) => {
    const defaultProps = {
        viewMode: 'circle',
        setViewMode: vi.fn(),
        isSettingsOpen: false,
        setIsSettingsOpen: vi.fn(),
    };

    return render(
        <LanguageContext.Provider value={mockLanguageContext as any}>
            <HarmonicContext.Provider value={mockHarmonicContext as any}>
                <AppToolbar {...defaultProps} {...props} />
            </HarmonicContext.Provider>
        </LanguageContext.Provider>
    );
};

describe('AppToolbar', () => {
    it('renders all toggle buttons', () => {
        renderToolbar();
        // Check for icons or specific elements of toggles
        expect(screen.getByText('♮')).toBeInTheDocument(); // Enharmonic
        // Bass icon is SVG, maybe check container presence or tooltip trigger
        expect(screen.getByText('View Mode', { selector: '.sr-only' })).not.toBeInTheDocument(); // No SR text yet.
        // Let's rely on finding by class or structure if roles aren't set
        const toggles = document.querySelectorAll('.tooltip-trigger');
        expect(toggles.length).toBe(4); // Enharmonic, Bass, View, Settings
    });

    it('opens settings modal on click', () => {
        const setIsSettingsOpen = vi.fn();
        renderToolbar({ setIsSettingsOpen });

        // Find Settings Toggle (last one usually, or by icon path content?) 
        // Best to add aria-labels in real code, but for now traverse DOM
        const toggles = document.querySelectorAll('.tooltip-trigger');
        const settingsToggle = toggles[3]; // Assuming order

        fireEvent.click(settingsToggle);
        expect(setIsSettingsOpen).toHaveBeenCalledWith(true);
    });

    it('toggles view mode', () => {
        const setViewMode = vi.fn();
        renderToolbar({ viewMode: 'circle', setViewMode });

        const toggles = document.querySelectorAll('.tooltip-trigger');
        const viewToggle = toggles[2]; // View Toggle

        fireEvent.click(viewToggle);
        expect(setViewMode).toHaveBeenCalledWith('cards');
    });

    it('shows tooltips on hover', async () => {
        renderToolbar();
        const toggles = document.querySelectorAll('.tooltip-trigger');
        const enharmonicToggle = toggles[0];

        fireEvent.mouseEnter(enharmonicToggle);

        await waitFor(() => {
            expect(screen.getByText('MUSICAL SPELLING')).toBeInTheDocument();
        });
    });
});

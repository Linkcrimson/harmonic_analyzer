import { useState, useEffect, useCallback } from 'react';
import { audioEngine } from '../audio/AudioEngine';

export function useAudioFeedback() {
    const [playingNotes, setPlayingNotes] = useState<Set<number>>(new Set());

    const [triggerTimes, setTriggerTimes] = useState<Map<number, number>>(new Map());

    const handleNoteOn = useCallback((noteId: number) => {
        const now = Date.now();
        setPlayingNotes(prev => {
            const next = new Set(prev);
            next.add(noteId);
            return next;
        });
        setTriggerTimes(prev => {
            const next = new Map(prev);
            next.set(noteId, now);
            return next;
        });
    }, []);

    const handleNoteOff = useCallback((noteId: number) => {
        setPlayingNotes(prev => {
            const next = new Set(prev);
            next.delete(noteId);
            return next;
        });
        // We don't necessarily need to remove from triggerTimes immediately if we want exit animations,
        // but typically we can keep it or clear it. Let's keep it to ensure key stability if needed, 
        // but removing it keeps map clean.
        setTriggerTimes(prev => {
            const next = new Map(prev);
            next.delete(noteId);
            return next;
        });
    }, []);

    useEffect(() => {
        // Subscribe
        audioEngine.subscribe('noteOn', handleNoteOn);
        audioEngine.subscribe('noteOff', handleNoteOff);

        return () => {
            // Unsubscribe
            audioEngine.unsubscribe('noteOn', handleNoteOn);
            audioEngine.unsubscribe('noteOff', handleNoteOff);
        };
    }, [handleNoteOn, handleNoteOff]);

    return { playingNotes, triggerTimes };
}

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface PWAContextType {
    isInstalled: boolean;
    needRefresh: boolean;
    offlineReady: boolean;
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
    installApp: () => void;
    canInstall: boolean;
    hardReset: () => void;
    statusMessage: string | null;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const usePWA = () => {
    const context = useContext(PWAContext);
    if (!context) {
        throw new Error('usePWA must be used within a PWAProvider');
    }
    return context;
};

// Define the BeforeInstallPromptEvent interface
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    // Check if app is installed (standalone mode)
    useEffect(() => {
        const checkInstall = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true;
            setIsInstalled(isStandalone);
        };

        checkInstall();
        window.addEventListener('resize', checkInstall); // Some browsers verify heavily on resize
        return () => window.removeEventListener('resize', checkInstall);
    }, []);

    // Handle beforeinstallprompt
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const {
        needRefresh: [needRefresh, setNeedRefresh],
        offlineReady: [offlineReady, setOfflineReady],
        updateServiceWorker
    } = useRegisterSW({
        onRegisteredMR(r) {
            if (r) {
                // Check every hour
                setInterval(() => {
                    r.update();
                }, 60 * 60 * 1000);
            }
        },
        onRegisterError(error) {
            console.error('SW registration error', error);
        },
    });

    useEffect(() => {
        if (needRefresh) {
            setStatusMessage("Nuova versione disponibile!");
        } else if (offlineReady) {
            setStatusMessage("App pronta offline");
            setTimeout(() => setStatusMessage(null), 3000);
        }
    }, [needRefresh, offlineReady]);

    const installApp = async () => {
        if (!deferredPrompt) return;

        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    const hardReset = async () => {
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
            }
        }
        // Clear caches
        if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(key => caches.delete(key)));
        }
        window.location.reload();
    };

    return (
        <PWAContext.Provider value={{
            isInstalled,
            needRefresh,
            offlineReady,
            updateServiceWorker,
            installApp,
            canInstall: !!deferredPrompt,
            hardReset,
            statusMessage
        }}>
            {children}
        </PWAContext.Provider>
    );
};

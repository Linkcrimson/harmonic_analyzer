import React from 'react';
import { usePWA } from '../../context/PWAContext';

export const AppSettings: React.FC = () => {
    const { isInstalled, needRefresh, updateServiceWorker, installApp, canInstall, hardReset } = usePWA();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Stato Applicazione</label>
                <div className="p-4 bg-[#222] rounded-xl border border-[#333] mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${isInstalled ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <span className="text-white font-medium">
                            {isInstalled ? 'App Installata' : 'Esecuzione nel Browser'}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        {/* @ts-ignore */}
                        Versione: {typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'N/A'}
                    </p>
                </div>

                <div className="space-y-3">
                    {/* Install Button */}
                    {!isInstalled && canInstall && (
                        <button
                            onClick={installApp}
                            className="w-full p-4 rounded-xl border border-blue-500/50 bg-blue-900/20 hover:bg-blue-900/30 transition-all text-left group"
                        >
                            <div className="font-medium text-blue-400 group-hover:text-blue-300">Installa App</div>
                            <div className="text-xs text-blue-500/70 mt-1">Aggiungi alla schermata home per un'esperienza migliore.</div>
                        </button>
                    )}

                    {/* Update Button */}
                    {needRefresh && (
                        <button
                            onClick={() => updateServiceWorker(true)}
                            className="w-full p-4 rounded-xl border border-green-500/50 bg-green-900/20 hover:bg-green-900/30 transition-all text-left"
                        >
                            <div className="font-medium text-green-400">Aggiornamento Disponibile</div>
                            <div className="text-xs text-green-500/70 mt-1">Clicca per installare la nuova versione.</div>
                        </button>
                    )}

                    {/* Hard Reset Button */}
                    <button
                        onClick={() => {
                            if (confirm("Sei sicuro? Questo ricaricherà la pagina e pulirà la cache dell'applicazione.")) {
                                hardReset();
                            }
                        }}
                        className="w-full p-4 rounded-xl border border-red-900/50 bg-red-900/10 hover:bg-red-900/20 transition-all text-left group"
                    >
                        <div className="font-medium text-red-400 group-hover:text-red-300">Reinstalla / Reset Completo</div>
                        <div className="text-xs text-red-500/70 mt-1">
                            Risolve problemi di visualizzazione reinstallando l'app da zero (pulisce cache e Service Worker).
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

import { useHarmonic } from '../context/HarmonicContext';

export const Header: React.FC = () => {
    const { midiConnected, sustainPedal, forceBassAsRoot, toggleBassAsRoot } = useHarmonic();

    return (
        <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-4">
                <div className="text-gray-500 text-sm font-medium tracking-widest uppercase">Analizzatore Armonico</div>

                {/* MIDI Status Indicators */}
                <div className="flex items-center gap-2 text-xs">
                    {midiConnected && (
                        <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            <span>MIDI</span>
                        </div>
                    )}
                    {sustainPedal && (
                        <div className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 font-bold">
                            SUS
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={toggleBassAsRoot}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${forceBassAsRoot
                        ? 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                    title="Forza la nota più bassa come fondamentale (disabilita rivolti)"
                >
                    Bass as Root
                </button>
            </div>
        </div>
    );
};

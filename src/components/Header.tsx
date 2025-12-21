import { useHarmonic } from '../context/HarmonicContext';

export const Header: React.FC = () => {
    const { midiConnected, sustainPedal } = useHarmonic();

    return (
        <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-4">
                <div className="text-gray-400 text-sm font-medium tracking-widest uppercase">Analizzatore Armonico</div>

                {/* MIDI Status Indicators */}
                <div className="flex items-center gap-2 text-xs">
                    {midiConnected && (
                        <div className="flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded-full border border-green-200">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></div>
                            <span className="hidden sm:inline">MIDI</span>
                        </div>
                    )}
                    {sustainPedal && (
                        <div className="text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
                            SUS
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

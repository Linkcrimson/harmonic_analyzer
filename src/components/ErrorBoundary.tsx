import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-8 max-w-md text-center shadow-2xl">
                        <div className="text-6xl mb-4">🎵</div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Oops! Qualcosa è andato storto
                        </h1>
                        <p className="text-gray-400 mb-6">
                            Si è verificato un errore imprevisto.
                            Non preoccuparti, i tuoi dati sono al sicuro.
                        </p>
                        {this.state.error && (
                            <details className="text-left mb-6">
                                <summary className="text-gray-500 cursor-pointer hover:text-gray-300 text-sm">
                                    Dettagli tecnici
                                </summary>
                                <pre className="mt-2 p-3 bg-[#111] rounded text-xs text-red-400 overflow-auto max-h-32">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}
                        <button
                            onClick={this.handleReload}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        >
                            Ricarica l'App
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

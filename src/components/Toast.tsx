import React from 'react';

interface ToastProps {
    message: string;
    visible: boolean;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export const Toast: React.FC<ToastProps> = ({ message, visible, action }) => {
    if (!visible) return null;

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[100] px-4 py-3 bg-[#1e1e1e] text-white text-sm rounded-lg shadow-xl border border-[#333] animate-fade-in-up flex items-center gap-4 min-w-[300px] justify-between">
            <span>{message}</span>
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition-colors"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};

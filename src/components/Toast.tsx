import React from 'react';

interface ToastProps {
    message: string;
    visible: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, visible }) => {
    if (!visible) return null;

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[100] px-4 py-2 bg-[#333] text-white text-sm rounded-full shadow-lg border border-[#444] animate-fade-in-up">
            {message}
        </div>
    );
};

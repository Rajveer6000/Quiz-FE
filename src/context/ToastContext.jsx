/**
 * Toast Context
 * Global toast notifications with different types
 */

import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const toastTypes = {
    success: {
        icon: CheckCircle,
        bgColor: 'bg-emerald-500/90',
        shadowColor: 'shadow-emerald-500/30',
    },
    error: {
        icon: XCircle,
        bgColor: 'bg-red-500/90',
        shadowColor: 'shadow-red-500/30',
    },
    warning: {
        icon: AlertTriangle,
        bgColor: 'bg-amber-500/90',
        shadowColor: 'shadow-amber-500/30',
    },
    info: {
        icon: Info,
        bgColor: 'bg-blue-500/90',
        shadowColor: 'shadow-blue-500/30',
    },
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Shorthand methods
    const toast = {
        success: (message, duration) => showToast(message, 'success', duration),
        error: (message, duration) => showToast(message, 'error', duration),
        warning: (message, duration) => showToast(message, 'warning', duration),
        info: (message, duration) => showToast(message, 'info', duration),
    };

    return (
        <ToastContext.Provider value={{ showToast, toast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
                {toasts.map((t) => {
                    const config = toastTypes[t.type] || toastTypes.info;
                    const IconComp = config.icon;

                    return (
                        <div
                            key={t.id}
                            className={`flex items-center gap-3 px-4 py-3 text-white rounded-2xl shadow-lg ${config.bgColor} ${config.shadowColor} animate-in slide-in-from-right-4 fade-in duration-300`}
                        >
                            <IconComp className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium">{t.message}</span>
                            <button
                                onClick={() => removeToast(t.id)}
                                className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

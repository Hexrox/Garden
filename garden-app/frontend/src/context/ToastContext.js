import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles = {
  success: 'bg-green-50 dark:bg-green-900/90 text-green-800 dark:text-green-100 border-green-200 dark:border-green-700',
  error: 'bg-red-50 dark:bg-red-900/90 text-red-800 dark:text-red-100 border-red-200 dark:border-red-700',
  warning: 'bg-amber-50 dark:bg-amber-900/90 text-amber-800 dark:text-amber-100 border-amber-200 dark:border-amber-700',
  info: 'bg-blue-50 dark:bg-blue-900/90 text-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-700',
};

const iconStyles = {
  success: 'text-green-500 dark:text-green-400',
  error: 'text-red-500 dark:text-red-400',
  warning: 'text-amber-500 dark:text-amber-400',
  info: 'text-blue-500 dark:text-blue-400',
};

const Toast = ({ toast, onClose }) => {
  const Icon = toastIcons[toast.type] || Info;

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm max-w-sm animate-slide-in-right ${toastStyles[toast.type]}`}
      role="alert"
    >
      <Icon size={20} className={`flex-shrink-0 mt-0.5 ${iconStyles[toast.type]}`} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-semibold text-sm">{toast.title}</p>
        )}
        <p className={`text-sm ${toast.title ? 'mt-0.5 opacity-90' : ''}`}>
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        aria-label="Zamknij"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((options) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      type: options.type || 'info',
      message: options.message,
      title: options.title,
      duration: options.duration ?? 5000,
    };

    setToasts((prev) => [...prev, toast]);

    // Auto-remove after duration
    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  }, [removeToast]);

  // Convenience methods
  const success = useCallback((message, options = {}) => {
    return addToast({ ...options, type: 'success', message });
  }, [addToast]);

  const error = useCallback((message, options = {}) => {
    return addToast({ ...options, type: 'error', message });
  }, [addToast]);

  const warning = useCallback((message, options = {}) => {
    return addToast({ ...options, type: 'warning', message });
  }, [addToast]);

  const info = useCallback((message, options = {}) => {
    return addToast({ ...options, type: 'info', message });
  }, [addToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onClose={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastContext;

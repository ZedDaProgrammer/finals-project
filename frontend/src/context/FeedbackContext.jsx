import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertOctagon, X } from 'lucide-react';

const FeedbackContext = createContext();

export const useFeedback = () => useContext(FeedbackContext);

const ToastItem = ({ id, type, message, onConfirm, onRemove }) => {
    useEffect(() => {
        // Auto-remove after 4 seconds
        const removeTimer = setTimeout(() => {
            onRemove(id);
        }, 4000);

        // Trigger callback (like reload) after 2.2 seconds if it exists
        let confirmTimer;
        if (onConfirm) {
            confirmTimer = setTimeout(() => {
                onConfirm();
            }, 2200);
        }

        return () => {
            clearTimeout(removeTimer);
            if (confirmTimer) clearTimeout(confirmTimer);
        };
    }, [id, onConfirm, onRemove]);

    const handleClose = () => {
        onRemove(id);
    };

    return (
        <div className={`cyber-toast ${type}`}>
            <div className="toast-icon-wrapper">
                {type === 'success' 
                    ? <CheckCircle2 className="toast-icon success" size={20} />
                    : <AlertOctagon className="toast-icon error" size={20} />
                }
            </div>
            <div className="toast-content-wrapper">
                <span className="toast-title">
                    {type === 'success' ? 'Success' : 'Notification'}
                </span>
                <p className="toast-message">{message}</p>
            </div>
            <button className="toast-close-btn" onClick={handleClose}>
                <X size={16} />
            </button>
        </div>
    );
};

export const FeedbackProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    // Call this from any page to show a stacked toast
    const showFeedback = useCallback((type, message, onConfirm = null) => {
        setToasts(prev => {
            const newToast = {
                id: Date.now() + Math.random(),
                type,
                message,
                onConfirm
            };
            const updated = [...prev, newToast];
            if (updated.length > 5) {
                // Keep only the 5 most recent toasts
                return updated.slice(updated.length - 5);
            }
            return updated;
        });
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <FeedbackContext.Provider value={{ showFeedback }}>
            {children}
            
            {/* Stacking Toast Notification Container */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <ToastItem 
                        key={toast.id}
                        id={toast.id}
                        type={toast.type}
                        message={toast.message}
                        onConfirm={toast.onConfirm}
                        onRemove={removeToast}
                    />
                ))}
            </div>
        </FeedbackContext.Provider>
    );
};
import React, { createContext, useState, useContext } from 'react';

const FeedbackContext = createContext();

export const useFeedback = () => useContext(FeedbackContext);

export const FeedbackProvider = ({ children }) => {
    const [modalConfig, setModalConfig] = useState({ 
        isOpen: false, 
        type: '', 
        message: '', 
        onConfirm: null 
    });

    // Call this from any page to show the modal
    const showFeedback = (type, message, onConfirm = null) => {
        setModalConfig({ isOpen: true, type, message, onConfirm });
    };

    const closeFeedback = () => {
        if (modalConfig.onConfirm) {
            modalConfig.onConfirm(); // E.g., reload the page if it was a success
        }
        setModalConfig({ isOpen: false, type: '', message: '', onConfirm: null });
    };

    return (
        <FeedbackContext.Provider value={{ showFeedback }}>
            {children}
            
            {/* The Global Modal UI - Renders anywhere in the app when triggered */}
            {modalConfig.isOpen && (
                <div className="glass-overlay" style={{ zIndex: 9999 }}>
                    <div className="glass-modal modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
                        <div className="placeholder-icon-wrapper" style={{ marginBottom: '15px' }}>
                            <span style={{ fontSize: '48px' }}>
                                {modalConfig.type === 'success' ? '✅' : '❌'}
                            </span>
                        </div>
                        <h3 style={{ 
                            color: modalConfig.type === 'success' ? '#28a745' : '#dc3545', 
                            borderBottom: 'none', 
                            marginBottom: '10px',
                            fontSize: '24px',
                            fontWeight: 'bold'
                        }}>
                            {modalConfig.type === 'success' ? 'Success' : 'Error'}
                        </h3>
                        <p style={{ fontSize: '15px', margin: '15px 0 25px 0', lineHeight: '1.5' }}>
                            {modalConfig.message}
                        </p>
                        <button 
                            className="confirm-btn" 
                            onClick={closeFeedback} 
                            style={{ 
                                width: '100%', 
                                background: modalConfig.type === 'success' ? '#28a745' : '#dc3545',
                                fontSize: '16px',
                                padding: '12px',
                                borderRadius: '10px',
                                border: 'none',
                                fontWeight: 'bold'
                            }}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}
        </FeedbackContext.Provider>
    );
};
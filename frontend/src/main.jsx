import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { FeedbackProvider } from '../context/FeedbackContext'; // <-- Import it here
import App from './App';
import '../style.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <FeedbackProvider>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </FeedbackProvider>
        </BrowserRouter>
    </React.StrictMode>
);
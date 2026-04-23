import React from 'react';
import './Toast.css';

export interface ToastProps {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
    return (
        <div className={`toast toast-${type}`}>
            <div className="toast-content">
                <span className="toast-message">{message}</span>
            </div>
            <button className="toast-close" onClick={() => onClose(id)}>×</button>
        </div>
    );
};

interface ToastContainerProps {
    toasts: Omit<ToastProps, 'onClose'>[];
    removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} onClose={removeToast} />
            ))}
        </div>
    );
};

export default ToastContainer;

import React from 'react';
import './EmptyState.css';

interface EmptyStateProps {
    message?: string;
    description?: string;
    icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    message = 'No Data Available',
    description = 'Try adjusting your filters to see results.',
    icon
}) => {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">
                {icon || (
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                )}
            </div>
            <h3>{message}</h3>
            <p>{description}</p>
        </div>
    );
};

export default EmptyState;

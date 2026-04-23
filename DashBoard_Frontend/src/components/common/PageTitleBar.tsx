import React from 'react';
import './PageTitleBar.css';

interface PageTitleBarProps {
    title: string;
    subtitle?: string;
    breadcrumbs?: string[];
    showMethodologyIcon?: boolean;
}

const PageTitleBar: React.FC<PageTitleBarProps> = ({ 
    title, 
    subtitle, 
    breadcrumbs = ['India', 'North East', 'All Regions'],
    showMethodologyIcon = true 
}) => {
    return (
        <div className="page-title-bar">
            <div className="title-section">
                <h1 className="page-title">{title}</h1>
                {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            <div className="breadcrumb-section">
                <nav className="breadcrumb-nav" aria-label="Breadcrumb">
                    {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={index}>
                            {index > 0 && <span className="breadcrumb-separator">→</span>}
                            <span className={`breadcrumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}`}>
                                {crumb}
                            </span>
                        </React.Fragment>
                    ))}
                </nav>
                {showMethodologyIcon && (
                    <button 
                        className="methodology-btn" 
                        title="View Methodology"
                        aria-label="View data methodology and standards"
                    >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                        </svg>
                        <span className="methodology-text">Methodology</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default PageTitleBar;

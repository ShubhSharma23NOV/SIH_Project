import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
    return (
        <footer className="app-footer">
            <div className="footer-content">
                <p>&copy; {new Date().getFullYear()} ArogyaJal. Smart India Hackathon 2025.</p>
                <div className="footer-links">
                    <span>Version 1.1.0</span>
                    <span className="separator">•</span>
                    <span>Government of India</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

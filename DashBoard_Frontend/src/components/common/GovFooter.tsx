import React from 'react';
import './GovFooter.css';

const GovFooter: React.FC = () => {
    const currentYear = new Date().getFullYear();
    
    return (
        <footer className="gov-footer">
            <div className="footer-container">
                <div className="footer-main">
                    <div className="footer-copyright">
                        © {currentYear} Government of India — Ministry of Jal Shakti | Version 1.2.1
                    </div>
                    <div className="footer-links">
                        <a href="#terms" className="footer-link">Terms</a>
                        <span className="footer-separator">|</span>
                        <a href="#privacy" className="footer-link">Privacy</a>
                        <span className="footer-separator">|</span>
                        <a href="#methodology" className="footer-link">Data Source & Methodology</a>
                    </div>
                </div>
                <div className="footer-disclaimer">
                    <strong>Disclaimer:</strong> This system provides real-time water quality monitoring and disease outbreak predictions. 
                    Data should be used for informational purposes and decision support. For critical health concerns, consult appropriate authorities.
                </div>
            </div>
        </footer>
    );
};

export default GovFooter;

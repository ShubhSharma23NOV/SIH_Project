import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './GovHeader.css';

const GovHeader: React.FC = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/'); // Redirect to landing page
    };

    return (
        <header className="gov-header">
            <div className="gov-header-container">
                {/* Left: Emblem + Identity */}
                <div className="gov-header-identity">
                    <img 
                        src="/logo/1285px-Emblem_of_India_(navy_blue).svg.png" 
                        alt="National Emblem of India" 
                        className="national-emblem"
                    />
                    <div className="gov-identity-text">
                        <h1 className="gov-system-title">
                            जल गुणवत्ता निगरानी प्रणाली | Water Quality Monitoring System
                        </h1>
                        <p className="gov-ministry-line">
                            Ministry of Jal Shakti — Department of Drinking Water & Sanitation
                        </p>
                    </div>
                </div>

                {/* Right: Utility Links + User */}
                <div className="gov-header-actions">
                    <nav className="gov-utility-links" aria-label="Utility Navigation">
                        <a href="https://jalshakti-ddws.gov.in" target="_blank" rel="noopener noreferrer" className="utility-link">Ministry Website</a>
                        <a href="#help" className="utility-link">Help</a>
                        <a href="#contact" className="utility-link">Contact</a>
                        <a href="#sitemap" className="utility-link">Sitemap</a>
                    </nav>
                    
                    {isAuthenticated && user ? (
                        <div className="gov-user-section">
                            <div className="gov-user-badge">
                                <svg className="user-icon" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                                </svg>
                                <div className="user-info">
                                    <span className="user-name">{user.fullName}</span>
                                    <span className="user-designation">{user.role.replace(/_/g, ' ')}</span>
                                </div>
                            </div>
                            <button onClick={handleLogout} className="logout-button" title="Logout">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
                                    <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
                                </svg>
                                Logout
                            </button>
                        </div>
                    ) : (
                        <Link to="/login" className="login-link">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path fillRule="evenodd" d="M6 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 0-1 0v2A1.5 1.5 0 0 0 6.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-8A1.5 1.5 0 0 0 5 3.5v2a.5.5 0 0 0 1 0v-2z"/>
                                <path fillRule="evenodd" d="M11.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H1.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
                            </svg>
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};

export default GovHeader;

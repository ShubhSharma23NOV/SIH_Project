import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './GovSidebar.css';

const GovSidebar: React.FC = () => {
    const location = useLocation();
    const { permissions, isAuthenticated } = useAuth();

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    return (
        <aside className="gov-sidebar" role="navigation" aria-label="Main Navigation">
            <nav className="gov-nav">
                {/* 1) Water Quality Monitoring */}
                <div className="nav-section">
                    <h3 className="nav-section-title">
                        जल गुणवत्ता निगरानी | Water Quality Monitoring
                    </h3>
                    <Link to="/dashboard" className={`gov-nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                        <svg className="nav-icon" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                        </svg>
                        <span>Home Dashboard</span>
                    </Link>
                    <Link 
                        to="/water-quality/a1" 
                        className={`gov-nav-link ${isActive('/water-quality/a1') ? 'active' : ''}`}
                    >
                        <svg className="nav-icon" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z"/>
                        </svg>
                        <span>A1 - Drinking Water Source</span>
                    </Link>
                    <Link 
                        to="/water-quality/a2" 
                        className={`gov-nav-link ${isActive('/water-quality/a2') ? 'active' : ''}`}
                    >
                        <svg className="nav-icon" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z"/>
                        </svg>
                        <span>A2 - Outdoor Bathing</span>
                    </Link>
                    <Link 
                        to="/water-quality/a3" 
                        className={`gov-nav-link ${isActive('/water-quality/a3') ? 'active' : ''}`}
                    >
                        <svg className="nav-icon" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z"/>
                        </svg>
                        <span>A3 - Treated Drinking Water</span>
                    </Link>
                </div>

                {/* 2) Disease Surveillance */}
                <div className="nav-section">
                    <h3 className="nav-section-title">
                        रोग निगरानी | Disease Surveillance
                    </h3>
                    <Link 
                        to="/disease-surveillance" 
                        className={`gov-nav-link ${isActive('/disease-surveillance') ? 'active' : ''}`}
                    >
                        <svg className="nav-icon" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                        </svg>
                        <span>Outbreak Monitoring</span>
                    </Link>
                    <Link 
                        to="/symptom-reports" 
                        className={`gov-nav-link ${isActive('/symptom-reports') ? 'active' : ''}`}
                    >
                        <svg className="nav-icon" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                        </svg>
                        <span>Symptom Reports</span>
                    </Link>
                    <Link 
                        to="/ml-dashboard" 
                        className={`gov-nav-link ${isActive('/ml-dashboard') ? 'active' : ''}`}
                    >
                        <svg className="nav-icon" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                        </svg>
                        <span>Outbreak Risk Assessment</span>
                    </Link>
                    <Link 
                        to="/alerts" 
                        className={`gov-nav-link ${isActive('/alerts') ? 'active' : ''}`}
                    >
                        <svg className="nav-icon" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                        </svg>
                        <span>Water Safety Incidents</span>
                    </Link>
                </div>

                {/* 3) GIS Map */}
                <div className="nav-section">
                    <h3 className="nav-section-title">
                        GIS मानचित्र | GIS Map
                    </h3>
                    <Link 
                        to="/gis-map" 
                        className={`gov-nav-link ${isActive('/gis-map') ? 'active' : ''}`}
                    >
                        <svg className="nav-icon" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd"/>
                        </svg>
                        <span>Geographic Map View</span>
                    </Link>
                </div>

                {/* 4) Reports & Downloads */}
                <div className="nav-section">
                    <h3 className="nav-section-title">
                        रिपोर्ट | Reports & Downloads
                    </h3>
                    <Link 
                        to="/reports" 
                        className={`gov-nav-link ${isActive('/reports') ? 'active' : ''}`}
                    >
                        <svg className="nav-icon" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd"/>
                        </svg>
                        <span>Download Reports</span>
                    </Link>
                    <Link 
                        to="/trends" 
                        className={`gov-nav-link ${isActive('/trends') ? 'active' : ''}`}
                    >
                        <svg className="nav-icon" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
                        </svg>
                        <span>Trends Analysis</span>
                    </Link>
                </div>

                {/* 5) Admin Section (Only if logged in with permission) */}
                {isAuthenticated && permissions?.canRegisterUsers && (
                    <div className="nav-section">
                        <h3 className="nav-section-title">
                            प्रशासन | Administration
                        </h3>
                        <Link 
                            to="/admin/register-user" 
                            className={`gov-nav-link ${isActive('/admin/register-user') ? 'active' : ''}`}
                        >
                            <svg className="nav-icon" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
                            </svg>
                            <span>Register User</span>
                        </Link>
                    </div>
                )}

                {/* 6) Help/Support */}
                <div className="nav-section">
                    <h3 className="nav-section-title">
                        सहायता | Help/Support
                    </h3>
                    <Link 
                        to="/help" 
                        className={`gov-nav-link ${isActive('/help') ? 'active' : ''}`}
                    >
                        <svg className="nav-icon" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                        </svg>
                        <span>Help & Methodology</span>
                    </Link>
                </div>
            </nav>
        </aside>
    );
};

export default GovSidebar;

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="gov-emblem-large">
            <img src="/logo/Dashboard-removebg-preview-Picsart-AiImageEnhancer.png" alt="ArogyaJal Dashboard" />
          </div>
          <h1 className="hero-title">
            जल गुणवत्ता निगरानी प्रणाली
          </h1>
          <h2 className="hero-subtitle">
            ArogyaJal - Water Quality Monitoring System
          </h2>
          <p className="hero-description">
            Ministry of Jal Shakti | Department of Drinking Water & Sanitation
          </p>
          <p className="hero-tagline">
            Ensuring Safe Drinking Water for North East India
          </p>
          
          
          
          <div className="hero-actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary-large">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                </svg>
                Go to Dashboard
              </Link>
            ) : (
              <Link to="/login" className="btn-primary-large">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Official Login
              </Link>
            )}
            <a href="#about" className="btn-secondary-large">
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-container">
          <h2 className="section-title">Key Features</h2>
          <p className="section-subtitle">Comprehensive Water Quality Monitoring & Health Surveillance</p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">💧</div>
              <h3>Real-Time Monitoring</h3>
              <p>24/7 water quality monitoring with IoT sensors across North East India</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🏥</div>
              <h3>Disease Surveillance</h3>
              <p>Track waterborne disease outbreaks and symptom reports from communities</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI Predictions</h3>
              <p>Machine learning models predict outbreak risks and water quality trends</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🗺️</div>
              <h3>GIS Mapping</h3>
              <p>Interactive maps showing water quality and health data across regions</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Analytics & Reports</h3>
              <p>Comprehensive reports and trend analysis for decision makers</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔔</div>
              <h3>Instant Alerts</h3>
              <p>Real-time notifications for water quality issues and health incidents</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section" id="about">
        <div className="section-container">
          <h2 className="section-title">About ArogyaJal</h2>
          <div className="about-content">
            <div className="about-text">
              <p>
                ArogyaJal is an integrated water quality monitoring and health surveillance system 
                designed specifically for the North East region of India, covering Assam, Meghalaya, 
                Arunachal Pradesh, Nagaland, Manipur, Mizoram, Tripura, and Sikkim.
              </p>
              <p>
                The system combines IoT sensors, mobile health reporting, machine learning predictions, 
                and GIS mapping to provide a comprehensive solution for ensuring safe drinking water 
                and preventing waterborne diseases.
              </p>
              <div className="about-stats">
                <div className="stat-item">
                  <div className="stat-number">8</div>
                  <div className="stat-label">States Covered</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">24/7</div>
                  <div className="stat-label">Monitoring</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">Real-Time</div>
                  <div className="stat-label">Alerts</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section" id="contact">
        <div className="section-container">
          <h2 className="section-title">Contact & Support</h2>
          <div className="contact-grid">
            <div className="contact-card">
              <div className="contact-icon">📧</div>
              <h3>Email Support</h3>
              <p>arogyajal@jalshakti.gov.in</p>
              <p className="contact-note">Response within 24 hours</p>
            </div>
            
            <div className="contact-card">
              <div className="contact-icon">📞</div>
              <h3>Helpline</h3>
              <p>1800-XXX-XXXX (Toll Free)</p>
              <p className="contact-note">Available 9 AM - 6 PM</p>
            </div>
            
            <div className="contact-card">
              <div className="contact-icon">🏛️</div>
              <h3>Office Address</h3>
              <p>Ministry of Jal Shakti</p>
              <p>Shram Shakti Bhawan, New Delhi</p>
            </div>
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="help-section" id="help">
        <div className="section-container">
          <h2 className="section-title">Help & Resources</h2>
          <div className="help-grid">
            <Link to="/help" className="help-card">
              <div className="help-icon">📖</div>
              <h3>User Guide</h3>
              <p>Complete documentation and methodology</p>
            </Link>
            
            <a href="#faq" className="help-card">
              <div className="help-icon">❓</div>
              <h3>FAQs</h3>
              <p>Frequently asked questions</p>
            </a>
            
            <a href="#training" className="help-card">
              <div className="help-icon">🎓</div>
              <h3>Training Materials</h3>
              <p>Videos and tutorials for officials</p>
            </a>
            
            <a href="#api" className="help-card">
              <div className="help-icon">🔌</div>
              <h3>API Documentation</h3>
              <p>For developers and integrations</p>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>ArogyaJal</h4>
            <p>Water Quality Monitoring System</p>
            <p>Ministry of Jal Shakti</p>
          </div>
          
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#about">About</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#contact">Contact</a></li>
              <li><Link to="/help">Help</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
              <li><a href="#disclaimer">Disclaimer</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Connect</h4>
            <ul>
              <li><a href="https://jalshakti-ddws.gov.in" target="_blank" rel="noopener noreferrer">Ministry Website</a></li>
              <li><a href="#social">Social Media</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>AROGYAJAL for © 2025 Smart India Hackathon.</p>
          <p>Powered By: CORE_401</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

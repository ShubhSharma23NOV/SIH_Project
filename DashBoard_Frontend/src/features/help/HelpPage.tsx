import React from 'react';
import './HelpPage.css';

const HelpPage: React.FC = () => {
    return (
        <div className="help-page">
            <div className="help-header">
                <h1>Help & Methodology</h1>
                <p className="help-subtitle">Understanding the ArogyaJal Water Quality Monitoring System</p>
            </div>

            <div className="help-content">
                <section className="help-section">
                    <h2>📖 System Overview</h2>
                    <p>
                        ArogyaJal is an integrated IoT and ML-powered platform for monitoring water quality 
                        and predicting disease outbreaks across North East India.
                    </p>
                </section>

                <section className="help-section">
                    <h2>🔬 Water Quality Categories</h2>
                    <div className="category-grid">
                        <div className="category-card">
                            <h3>A1 - Drinking Water Source</h3>
                            <p>Water intended for drinking without conventional treatment</p>
                        </div>
                        <div className="category-card">
                            <h3>A2 - Outdoor Bathing</h3>
                            <p>Water for organized outdoor bathing areas</p>
                        </div>
                        <div className="category-card">
                            <h3>A3 - Conventional Treatment</h3>
                            <p>Water requiring conventional treatment before drinking</p>
                        </div>
                    </div>
                </section>

                <section className="help-section">
                    <h2>📊 Water Quality Index (WQI)</h2>
                    <p>The WQI is calculated based on four key parameters:</p>
                    <ul>
                        <li><strong>pH:</strong> Measure of acidity/alkalinity (Ideal: 6.5-8.5)</li>
                        <li><strong>Turbidity:</strong> Cloudiness of water (Ideal: &lt; 5 NTU)</li>
                        <li><strong>TDS:</strong> Total Dissolved Solids (Ideal: &lt; 500 ppm)</li>
                        <li><strong>Temperature:</strong> Water temperature (Ideal: 20-30°C)</li>
                    </ul>
                </section>

                <section className="help-section">
                    <h2>🎯 Quality Status Classification</h2>
                    <table className="status-table">
                        <thead>
                            <tr>
                                <th>WQI Range</th>
                                <th>Status</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>0-25</td>
                                <td><span className="status-badge excellent">Excellent</span></td>
                                <td>Safe for drinking</td>
                            </tr>
                            <tr>
                                <td>26-50</td>
                                <td><span className="status-badge good">Good</span></td>
                                <td>Generally safe</td>
                            </tr>
                            <tr>
                                <td>51-75</td>
                                <td><span className="status-badge fair">Fair</span></td>
                                <td>Requires attention</td>
                            </tr>
                            <tr>
                                <td>76-100</td>
                                <td><span className="status-badge poor">Poor</span></td>
                                <td>Not recommended</td>
                            </tr>
                            <tr>
                                <td>&gt;100</td>
                                <td><span className="status-badge critical">Critical</span></td>
                                <td>Unsafe for use</td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                <section className="help-section">
                    <h2>📞 Contact Support</h2>
                    <p>For technical assistance or queries, please contact:</p>
                    <p><strong>Email:</strong> support@arogyajal.gov.in</p>
                    <p><strong>Phone:</strong> 1800-XXX-XXXX (Toll Free)</p>
                </section>
            </div>
        </div>
    );
};

export default HelpPage;

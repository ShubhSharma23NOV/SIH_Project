import React from 'react';
import Header from './Header';
import Footer from './Footer';
import GlobalFilterBar from './GlobalFilterBar';
import './Layout.css';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="app-layout">
            <div className="layout-content">
                <Header />
                <div className="filter-section">
                    <GlobalFilterBar />
                </div>
                <main className="main-container">
                    {children}
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default Layout;

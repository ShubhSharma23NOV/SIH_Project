import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { GlobalFilterProvider } from './contexts/GlobalFilterContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import GovHeader from './components/common/GovHeader';
import GovSidebar from './components/common/GovSidebar';
import GovFooter from './components/common/GovFooter';
import UniversalFilterBar from './components/common/UniversalFilterBar';
import GovDashboard from './features/dashboard/GovDashboard';
import WaterQualityA1 from './features/water-quality/WaterQualityA1';
import WaterQualityA2 from './features/water-quality/WaterQualityA2';
import WaterQualityA3 from './features/water-quality/WaterQualityA3';
import DiseaseSurveillance from './features/disease/DiseaseSurveillance';
import SymptomReportsPage from './features/symptomReports/SymptomReportsPage';
import MLDashboard from './features/ml/MLDashboard';
import AlertsPage from './features/alerts/AlertsPage';
import MapPage from './features/map/MapPage';
import ReportsPage from './features/reports/ReportsPage';
import Trends from './features/trends/Trends';
import HelpPage from './features/help/HelpPage';
import LoginPage from './features/auth/LoginPage';
import UserRegistration from './features/admin/UserRegistration';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './features/landing/LandingPage';
import './styles/gov-design-tokens.css';
import './gov-layout.css';
import './App.css';
import './layout-fix.css';

const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Landing Page (No Layout) */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Login Page (No Layout) */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Dashboard Pages (With Layout) */}
      <Route path="/*" element={
        <div className="app">
          {/* Government Header */}
          <GovHeader />

          {/* Government Sidebar */}
          <GovSidebar />

          {/* Main Content */}
          <div className="main-content">
            {/* Universal Filter Bar */}
            <UniversalFilterBar />

            {/* Page Content */}
            <div className="page-content">
              <Routes>
                {/* Public Routes - Accessible without login */}
                <Route path="/dashboard" element={<GovDashboard />} />
                <Route path="/help" element={<HelpPage />} />
                
                {/* Protected Routes - Require Login */}
                <Route path="/water-quality/a1" element={
                  <ProtectedRoute requireAuth={true}>
                    <WaterQualityA1 />
                  </ProtectedRoute>
                } />
                <Route path="/water-quality/a2" element={
                  <ProtectedRoute requireAuth={true}>
                    <WaterQualityA2 />
                  </ProtectedRoute>
                } />
                <Route path="/water-quality/a3" element={
                  <ProtectedRoute requireAuth={true}>
                    <WaterQualityA3 />
                  </ProtectedRoute>
                } />
                <Route path="/disease-surveillance" element={
                  <ProtectedRoute requireAuth={true}>
                    <DiseaseSurveillance />
                  </ProtectedRoute>
                } />
                <Route path="/symptom-reports" element={
                  <ProtectedRoute requireAuth={true}>
                    <SymptomReportsPage />
                  </ProtectedRoute>
                } />
                <Route path="/ml-dashboard" element={
                  <ProtectedRoute requireAuth={true}>
                    <MLDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/alerts" element={
                  <ProtectedRoute requireAuth={true}>
                    <AlertsPage />
                  </ProtectedRoute>
                } />
                <Route path="/gis-map" element={
                  <ProtectedRoute requireAuth={true}>
                    <MapPage />
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute requireAuth={true}>
                    <ReportsPage />
                  </ProtectedRoute>
                } />
                <Route path="/trends" element={
                  <ProtectedRoute requireAuth={true}>
                    <Trends />
                  </ProtectedRoute>
                } />
                
                {/* Admin Routes - Require Login + Permission */}
                <Route path="/admin/register-user" element={
                  <ProtectedRoute requireAuth={true} requiredPermission="canRegisterUsers">
                    <UserRegistration />
                  </ProtectedRoute>
                } />
              </Routes>
              
              {/* Government Footer */}
              <GovFooter />
            </div>
          </div>
        </div>
      } />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <GlobalFilterProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </GlobalFilterProvider>
    </ToastProvider>
  );
};

export default App;

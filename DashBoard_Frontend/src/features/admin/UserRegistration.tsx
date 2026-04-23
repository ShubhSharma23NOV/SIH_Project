import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './UserRegistration.css';

const UserRegistration: React.FC = () => {
  const { user, jurisdiction, permissions, token } = useAuth();
  
  const [formData, setFormData] = useState({
    role: '',
    fullName: '',
    phoneNumber: '',
    email: '',
    password: '',
    state: jurisdiction?.state || '',
    district: jurisdiction?.district || '',
    block: jurisdiction?.block || '',
    village: jurisdiction?.village || '',
    pincode: '',
    designation: '',
    employeeId: '',
    phcName: '',
    clinicName: '',
    labId: '',
    ashaId: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get registerable roles based on current user role
  const getRegisterableRoles = (): { value: string; label: string }[] => {
    if (!user) return [];

    switch (user.role) {
      case 'STATE_ADMIN':
        return [
          { value: 'DISTRICT_HEALTH_OFFICER', label: 'District Health Officer' },
          { value: 'LAB_OFFICIAL', label: 'Lab Official' },
        ];
      case 'DISTRICT_HEALTH_OFFICER':
        return [
          { value: 'MEDICAL_OFFICER', label: 'Medical Officer' },
          { value: 'VILLAGE_HEALTH_OFFICER', label: 'Village Health Officer' },
        ];
      case 'VILLAGE_HEALTH_OFFICER':
        return [
          { value: 'ASHA_WORKER', label: 'ASHA Worker' },
          { value: 'CLINIC', label: 'Clinic' },
        ];
      default:
        return [];
    }
  };

  const registerableRoles = getRegisterableRoles();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('http://localhost:8080/api/users/register-official', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || '',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(`User registered successfully! Email: ${data.email}`);
      
      // Reset form
      setFormData({
        role: '',
        fullName: '',
        phoneNumber: '',
        email: '',
        password: '',
        state: jurisdiction?.state || '',
        district: jurisdiction?.district || '',
        block: jurisdiction?.block || '',
        village: jurisdiction?.village || '',
        pincode: '',
        designation: '',
        employeeId: '',
        phcName: '',
        clinicName: '',
        labId: '',
        ashaId: '',
      });

    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Check permission
  if (!permissions?.canRegisterUsers) {
    return (
      <div className="user-registration-page">
        <div className="permission-denied">
          <h2>⛔ Access Denied</h2>
          <p>You don't have permission to register users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-registration-page">
      <div className="page-header">
        <h1>Register New User</h1>
        <p>Register government officials within your jurisdiction</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="registration-form">
        {/* Role Selection */}
        <div className="form-section">
          <h3>Role Information</h3>
          
          <div className="form-group">
            <label htmlFor="role" className="required">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              disabled={isLoading}
            >
              <option value="">Select Role</option>
              {registerableRoles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Personal Information */}
        <div className="form-section">
          <h3>Personal Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fullName" className="required">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="Enter full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="designation">Designation</label>
              <input
                type="text"
                id="designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="e.g., Senior Medical Officer"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email" className="required">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="official@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber" className="required">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="+919876543210"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="required">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="Minimum 8 characters"
              minLength={8}
            />
          </div>
        </div>

        {/* Role-Specific Fields */}
        {formData.role === 'MEDICAL_OFFICER' && (
          <div className="form-section">
            <h3>Medical Officer Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="employeeId">Employee ID</label>
                <input
                  type="text"
                  id="employeeId"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="phcName">PHC/CHC Name</label>
                <input
                  type="text"
                  id="phcName"
                  name="phcName"
                  value={formData.phcName}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        )}

        {formData.role === 'LAB_OFFICIAL' && (
          <div className="form-section">
            <h3>Lab Official Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="employeeId">Employee ID</label>
                <input
                  type="text"
                  id="employeeId"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="labId">Lab ID</label>
                <input
                  type="text"
                  id="labId"
                  name="labId"
                  value={formData.labId}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        )}

        {formData.role === 'ASHA_WORKER' && (
          <div className="form-section">
            <h3>ASHA Worker Details</h3>
            <div className="form-group">
              <label htmlFor="ashaId">ASHA ID</label>
              <input
                type="text"
                id="ashaId"
                name="ashaId"
                value={formData.ashaId}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        {formData.role === 'CLINIC' && (
          <div className="form-section">
            <h3>Clinic Details</h3>
            <div className="form-group">
              <label htmlFor="clinicName">Clinic Name</label>
              <input
                type="text"
                id="clinicName"
                name="clinicName"
                value={formData.clinicName}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        {/* Location Information */}
        <div className="form-section">
          <h3>Location (Jurisdiction)</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="state" className="required">State</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                disabled={isLoading || !!jurisdiction?.state}
                placeholder="State"
              />
            </div>

            <div className="form-group">
              <label htmlFor="district">District</label>
              <input
                type="text"
                id="district"
                name="district"
                value={formData.district}
                onChange={handleChange}
                disabled={isLoading || !!jurisdiction?.district}
                placeholder="District"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="block">Block/Tehsil</label>
              <input
                type="text"
                id="block"
                name="block"
                value={formData.block}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Block"
              />
            </div>

            <div className="form-group">
              <label htmlFor="village">Village/City</label>
              <input
                type="text"
                id="village"
                name="village"
                value={formData.village}
                onChange={handleChange}
                disabled={isLoading || !!jurisdiction?.village}
                placeholder="Village"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="pincode">Pincode</label>
            <input
              type="text"
              id="pincode"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="6-digit pincode"
              pattern="[0-9]{6}"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Registering...' : 'Register User'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserRegistration;

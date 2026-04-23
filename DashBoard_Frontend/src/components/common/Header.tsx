import React from 'react';
import { useGlobalFilter } from '../../contexts/GlobalFilterContext';
import './Header.css';

const Header: React.FC = () => {
    const { roleMetadata } = useGlobalFilter();
    const roleName = roleMetadata?.role ? roleMetadata.role.replace('_', ' ') : 'Guest User';

    // Build location string from locked fields
    const locationParts: string[] = [];
    if (roleMetadata?.lockedState) locationParts.push(roleMetadata.lockedState);
    if (roleMetadata?.lockedDistrict) locationParts.push(roleMetadata.lockedDistrict);
    if (roleMetadata?.lockedCity) locationParts.push(roleMetadata.lockedCity);
    if (roleMetadata?.lockedVillage) locationParts.push(roleMetadata.lockedVillage);
    const location = locationParts.length > 0 ? ` – ${locationParts.join(', ')}` : '';

    return (
        <header className="app-header">
            <div className="header-left">
                <h1 className="app-title">ArogyaJal</h1>
                <span className="app-subtitle">Water Quality Monitoring System</span>
            </div>
            <div className="header-right">
                <div className="user-profile">
                    <div className="user-avatar">
                        <span>{roleName.charAt(0)}</span>
                    </div>
                    <div className="user-info">
                        <span className="user-role">{roleName}{location}</span>
                        <span className="user-status">Online</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;

import React from 'react';
import './Breadcrumb.css';

interface BreadcrumbProps {
  items: string[];
  deviceId?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, deviceId }) => {
  if (items.length === 0 && !deviceId) {
    return (
      <div className="breadcrumb">
        <span className="breadcrumb-item all-devices">📍 All devices overview</span>
      </div>
    );
  }

  return (
    <div className="breadcrumb">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <span className="breadcrumb-item">{item}</span>
          {(index < items.length - 1 || deviceId) && (
            <span className="breadcrumb-separator">›</span>
          )}
        </React.Fragment>
      ))}
      {deviceId && (
        <span className="breadcrumb-item device-id">{deviceId}</span>
      )}
    </div>
  );
};

export default Breadcrumb;

import React, { useState } from 'react';
import { useGlobalFilter } from '../../contexts/GlobalFilterContext';
import './GlobalFilterBar.css';

interface GlobalFilterBarProps {
  showChangeButton?: boolean;
}

const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({ showChangeButton = true }) => {
  const { filter, roleMetadata, resetFilter, getBreadcrumb } = useGlobalFilter();
  const [showFilterModal, setShowFilterModal] = useState(false);

  const breadcrumb = getBreadcrumb();
  const isRoleLocked = filter.source === 'ROLE_LOCK';
  const hasActiveFilter = breadcrumb.length > 0;

  const handleChangeFilter = () => {
    setShowFilterModal(true);
  };

  const handleClearFilter = () => {
    if (window.confirm('Are you sure you want to clear all filters?')) {
      resetFilter();
    }
  };

  return (
    <>
      <div className="global-filter-bar">
        <div className="filter-bar-content">
          {/* Filter Icon and Label */}
          <div className="filter-bar-icon">
            <span className="icon">📍</span>
            <span className="label">Viewing:</span>
          </div>

          {/* Breadcrumb */}
          <div className="filter-bar-breadcrumb">
            {hasActiveFilter ? (
              <>
                {breadcrumb.map((item, index) => (
                  <React.Fragment key={index}>
                    <span className="breadcrumb-item">{item}</span>
                    {index < breadcrumb.length - 1 && (
                      <span className="breadcrumb-separator">›</span>
                    )}
                  </React.Fragment>
                ))}
              </>
            ) : (
              <span className="breadcrumb-item all-regions">All Regions (Live Stream)</span>
            )}
          </div>

          {/* Role Lock Indicator */}
          {isRoleLocked && roleMetadata && (
            <div className="role-lock-badge">
              <span className="lock-icon">🔒</span>
              <span className="lock-text">{roleMetadata.role.replace('_', ' ')}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="filter-bar-actions">
            {showChangeButton && (
              <button
                className="filter-action-btn change-btn"
                onClick={handleChangeFilter}
                disabled={isRoleLocked && breadcrumb.length === 0}
              >
                <span className="btn-icon">🔄</span>
                Change Filter
              </button>
            )}

            {!isRoleLocked && hasActiveFilter && (
              <button
                className="filter-action-btn clear-btn"
                onClick={handleClearFilter}
              >
                <span className="btn-icon">✕</span>
                Clear Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Modal (placeholder - will be implemented) */}
      {showFilterModal && (
        <div className="filter-modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="filter-modal-header">
              <h3>Change Location Filter</h3>
              <button className="close-btn" onClick={() => setShowFilterModal(false)}>
                ✕
              </button>
            </div>
            <div className="filter-modal-body">
              <p>Filter selection interface will be integrated here.</p>
              <p>For now, use the main dashboard filter component.</p>
            </div>
            <div className="filter-modal-footer">
              <button className="modal-btn cancel-btn" onClick={() => setShowFilterModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalFilterBar;

import React, { useState } from 'react';
import './Alerts.css';

interface AlertFiltersProps {
  filters: {
    severity: string;
    village: string;
    status: string;
  };
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
}

const AlertFilters: React.FC<AlertFiltersProps> = ({ 
  filters, 
  onFilterChange, 
  onClearFilters 
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFilters = { ...localFilters, [name]: value };
    setLocalFilters(newFilters);
  };

  const handleApply = () => {
    onFilterChange(localFilters);
  };

  return (
    <div className="filter-container">
      <h3>Filter Alerts</h3>
      <div className="filter-controls">
        <div className="filter-group">
          <label htmlFor="severityFilter">Severity</label>
          <select 
            id="severityFilter"
            name="severity"
            value={localFilters.severity}
            onChange={handleChange}
          >
            <option value="all">All Severities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="villageFilter">Village</label>
          <select 
            id="villageFilter"
            name="village"
            value={localFilters.village}
            onChange={handleChange}
          >
            <option value="all">All Villages</option>
            <option value="majuli">Majuli</option>
            <option value="diphu">Diphu</option>
            <option value="jorhat">Jorhat</option>
            <option value="dibrugarh">Dibrugarh</option>
            <option value="tinsukia">Tinsukia</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="statusFilter">Status</label>
          <select 
            id="statusFilter"
            name="status"
            value={localFilters.status}
            onChange={handleChange}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="filter-actions">
          <button 
            className="btn btn-primary" 
            onClick={handleApply}
          >
            <i className="fa-solid fa-filter"></i> Apply Filters
          </button>
          <button 
            className="btn btn-outline"
            onClick={() => {
              const defaultFilters = { 
                severity: 'all', 
                village: 'all', 
                status: 'all' 
              };
              setLocalFilters(defaultFilters);
              onClearFilters();
            }}
          >
            <i className="fa-solid fa-times"></i> Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertFilters;

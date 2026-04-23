import React, { useState, useEffect } from 'react';
import { useGlobalFilter } from '../../contexts/GlobalFilterContext';
import { getStates, getDistricts, getCities, getVillages } from '../../services/waterQuality.service';
import './UniversalFilterBar.css';

const UniversalFilterBar: React.FC = () => {
    const { filter, updateFilter, resetFilter, getBreadcrumb } = useGlobalFilter();
    
    const [states, setStates] = useState<string[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [villages, setVillages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const breadcrumb = getBreadcrumb();

    useEffect(() => {
        loadStates();
    }, []);

    useEffect(() => {
        if (filter.state) {
            loadDistricts(filter.state);
        }
    }, [filter.state]);

    useEffect(() => {
        if (filter.state && filter.district) {
            loadCities(filter.state, filter.district);
        }
    }, [filter.state, filter.district]);

    useEffect(() => {
        if (filter.state && filter.district) {
            loadVillages(filter.state, filter.district, filter.city || undefined);
        }
    }, [filter.state, filter.district, filter.city]);

    const loadStates = async () => {
        try {
            const data = await getStates();
            setStates(data);
        } catch (error) {
            console.error('Error loading states:', error);
        }
    };

    const loadDistricts = async (state: string) => {
        setLoading(true);
        try {
            const data = await getDistricts(state);
            setDistricts(data);
        } catch (error) {
            console.error('Error loading districts:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCities = async (state: string, district: string) => {
        setLoading(true);
        try {
            const data = await getCities(state, district);
            setCities(data);
        } catch (error) {
            console.error('Error loading cities:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadVillages = async (state: string, district: string, city?: string) => {
        setLoading(true);
        try {
            const data = await getVillages(state, district, city);
            setVillages(data);
        } catch (error) {
            console.error('Error loading villages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStateChange = (state: string) => {
        updateFilter('state', state || null);
        setDistricts([]);
        setCities([]);
        setVillages([]);
    };

    const handleDistrictChange = (district: string) => {
        updateFilter('district', district || null);
        setCities([]);
        setVillages([]);
    };

    const handleCityChange = (city: string) => {
        updateFilter('city', city || null);
        setVillages([]);
    };

    const handleVillageChange = (village: string) => {
        updateFilter('village', village || null);
    };

    const handleClearFilters = () => {
        resetFilter();
        setDistricts([]);
        setCities([]);
        setVillages([]);
    };

    return (
        <div className="universal-filter-bar">
            {/* Breadcrumb Navigation */}
            <div className="breadcrumb-section">
                <span className="breadcrumb-label">Location:</span>
                <div className="breadcrumb-path">
                    <span className="breadcrumb-item">India</span>
                    {breadcrumb.length > 0 ? (
                        breadcrumb.map((item, index) => (
                            <React.Fragment key={index}>
                                <span className="breadcrumb-separator">→</span>
                                <span className="breadcrumb-item active">{item}</span>
                            </React.Fragment>
                        ))
                    ) : (
                        <>
                            <span className="breadcrumb-separator">→</span>
                            <span className="breadcrumb-item muted">All Regions</span>
                        </>
                    )}
                </div>
                <button 
                    className="filter-toggle-btn"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    {showFilters ? '▲ Hide Filters' : '▼ Show Filters'}
                </button>
            </div>

            {/* Filter Dropdowns */}
            {showFilters && (
                <div className="filter-dropdowns">
                    <div className="filter-row">
                        <div className="filter-group">
                            <label htmlFor="state-select">State</label>
                            <select
                                id="state-select"
                                value={filter.state || ''}
                                onChange={(e) => handleStateChange(e.target.value)}
                                disabled={loading}
                            >
                                <option value="">All States</option>
                                {states.map((state) => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="district-select">District</label>
                            <select
                                id="district-select"
                                value={filter.district || ''}
                                onChange={(e) => handleDistrictChange(e.target.value)}
                                disabled={!filter.state || loading}
                            >
                                <option value="">All Districts</option>
                                {districts.map((district) => (
                                    <option key={district} value={district}>{district}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="block-select">Block/City</label>
                            <select
                                id="block-select"
                                value={filter.city || ''}
                                onChange={(e) => handleCityChange(e.target.value)}
                                disabled={!filter.district || loading}
                            >
                                <option value="">All Blocks</option>
                                {cities.map((city) => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="village-select">Village</label>
                            <select
                                id="village-select"
                                value={filter.village || ''}
                                onChange={(e) => handleVillageChange(e.target.value)}
                                disabled={!filter.district || loading}
                            >
                                <option value="">All Villages</option>
                                {villages.map((village) => (
                                    <option key={village} value={village}>{village}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="source-select">Water Source</label>
                            <select id="source-select">
                                <option value="">All Sources</option>
                                <option value="handpump">Hand Pump</option>
                                <option value="well">Well</option>
                                <option value="tap">Tap Water</option>
                                <option value="river">River</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="date-range">Date Range</label>
                            <select id="date-range">
                                <option value="24h">Last 24 Hours</option>
                                <option value="7d">Last 7 Days</option>
                                <option value="30d">Last 30 Days</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>

                        <div className="filter-actions">
                            <button 
                                className="apply-btn"
                                onClick={() => setShowFilters(false)}
                            >
                                Apply Filters
                            </button>
                            <button 
                                className="clear-btn"
                                onClick={handleClearFilters}
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UniversalFilterBar;

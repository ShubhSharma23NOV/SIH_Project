import React, { useState, useEffect, useCallback } from 'react';
import { useGlobalFilter } from '../../contexts/GlobalFilterContext';
import { DeviceInfo, getDevicesByLocation } from '../../services/waterQuality.service';
import WaterQualityCard from '../../components/WaterQualityCard';
import './WaterQualityCategory.css';

const WaterQualityA3: React.FC = () => {
    const { filter } = useGlobalFilter();
    const [devices, setDevices] = useState<DeviceInfo[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null);

    const fetchDevices = useCallback(async () => {
        try {
            const fetchedDevices = await getDevicesByLocation(
                filter.state || undefined,
                filter.district || undefined,
                filter.city || undefined,
                filter.village || undefined
            );
            setDevices(fetchedDevices);
        } catch (error) {
            console.error('Error fetching devices:', error);
        }
    }, [filter.state, filter.district, filter.city, filter.village]);

    useEffect(() => {
        fetchDevices();
    }, [fetchDevices]);

    return (
        <div className="water-quality-category">
            <div className="category-header">
                <h1>A3 - Drinking Water Source (Conventional Treatment)</h1>
                <p className="category-description">
                    Water quality monitoring for sources requiring conventional treatment before drinking
                </p>
            </div>

            <div className="category-content">
                <div className="devices-table-section">
                    <h2>Water Sources ({devices.length})</h2>
                    <table className="gov-table">
                        <thead>
                            <tr>
                                <th>S.No.</th>
                                <th>Source ID</th>
                                <th>Location</th>
                                <th>Source Type</th>
                                <th>Operational Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {devices.map((device, index) => (
                                <tr key={device.deviceId}>
                                    <td>{index + 1}</td>
                                    <td className="device-id-cell">{device.deviceId}</td>
                                    <td>{device.village}, {device.district}</td>
                                    <td>{device.waterSourceType}</td>
                                    <td>
                                        <span className={`status-badge ${device.verified ? 'active' : 'inactive'}`}>
                                            {device.verified ? 'Functional' : 'Non-Functional'}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            className="view-btn"
                                            onClick={() => setSelectedDevice(device)}
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedDevice && (
                <div className="modal-overlay" onClick={() => setSelectedDevice(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Water Quality Details — {selectedDevice.deviceId}</h2>
                            <button className="close-btn" onClick={() => setSelectedDevice(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <WaterQualityCard deviceId={selectedDevice.deviceId} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WaterQualityA3;

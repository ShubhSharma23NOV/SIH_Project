export type StatusLevel = 'GOOD' | 'MODERATE' | 'POOR' | 'CRITICAL' | 'UNKNOWN' | 'SAFE' | 'UNSAFE';

export const STATUS_CONFIG: Record<string, { label: string; color: string; badge: string }> = {
    GOOD: {
        label: 'Safe',
        color: '#10b981', // green-500
        badge: 'success'
    },
    SAFE: {
        label: 'Safe',
        color: '#10b981', // green-500
        badge: 'success'
    },
    MODERATE: {
        label: 'Needs Monitoring',
        color: '#f59e0b', // amber-500
        badge: 'warning'
    },
    MEDIUM: {
        label: 'Needs Monitoring',
        color: '#f59e0b', // amber-500
        badge: 'warning'
    },
    POOR: {
        label: 'Unsafe',
        color: '#f97316', // orange-500
        badge: 'danger'
    },
    HIGH: {
        label: 'Unsafe',
        color: '#f97316', // orange-500
        badge: 'danger'
    },
    UNSAFE: {
        label: 'Unsafe',
        color: '#f97316', // orange-500
        badge: 'danger'
    },
    CRITICAL: {
        label: 'Dangerous',
        color: '#ef4444', // red-500
        badge: 'critical'
    },
    VERY_POOR: {
        label: 'Dangerous',
        color: '#ef4444', // red-500
        badge: 'critical'
    },
    UNKNOWN: {
        label: 'No Data',
        color: '#6b7280', // gray-500
        badge: 'secondary'
    },
    NOT_REPORTING: {
        label: 'Not Reporting',
        color: '#9ca3af', // gray-400
        badge: 'secondary'
    }
};

export const getStatusConfig = (status: string) => {
    if (!status) return STATUS_CONFIG.UNKNOWN;
    const normalizedStatus = status.toUpperCase();
    return STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.UNKNOWN;
};

export const getStatusColor = (status: string) => {
    return getStatusConfig(status).color;
};

export const getStatusLabel = (status: string) => {
    return getStatusConfig(status).label;
};

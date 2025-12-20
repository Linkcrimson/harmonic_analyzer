export const getIntervalColor = (type: string | undefined): string => {
    switch (type) {
        case 'root': return 'var(--col-root)';
        case 'third': return 'var(--col-third)';
        case 'fifth': return 'var(--col-fifth)';
        case 'seventh': return 'var(--col-seventh)';
        case 'ext': return 'var(--col-ext)';
        default: return '#333'; // Default/Inactive
    }
};

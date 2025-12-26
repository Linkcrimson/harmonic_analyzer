export const getIntervalColor = (type: string | undefined): string => {
    switch (type) {
        case 'root': return 'var(--col-root)';
        case 'third': return 'var(--col-third)';
        case 'fifth': return 'var(--col-fifth)';
        case 'seventh': return 'var(--col-seventh)';
        case 'ext':
        case 'b9':
        case '9':
        case '#9':
        case '11':
        case '#11':
        case 'b13':
        case '13':
        case '#13':
            return 'var(--col-ext)';
        default: return '#333'; // Default/Inactive
    }
};

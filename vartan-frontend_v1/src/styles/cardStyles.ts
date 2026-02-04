import { Theme } from '@mui/material';

export const cardWithShadowStyles = {
    boxShadow: (theme: Theme) =>
        theme.palette.mode === 'dark'
            ? '0 2px 8px rgba(0, 0, 0, 0.4)'
            : '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: (theme: Theme) =>
        theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.12)'
            : '1px solid rgba(0, 0, 0, 0.12)'
};

export const tableCardStyles = {
    ...cardWithShadowStyles
};

export const chartCardStyles = {
    ...cardWithShadowStyles
};

export const kpiCardStyles = {
    ...cardWithShadowStyles
};


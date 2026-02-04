import { SxProps, Theme } from "@mui/material";

export const scrollbarStyles: SxProps<Theme> = {
    '&::-webkit-scrollbar': {
        width: '10px',
        height: '10px',
    },
    '&::-webkit-scrollbar-track': {
        backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.grey[100] : theme.palette.grey[200],
    },
    '&::-webkit-scrollbar-thumb': {
        backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.grey[400] : theme.palette.grey[500],
        borderRadius: '5px',
        '&:hover': {
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.grey[500] : theme.palette.grey[600],
        },
    },
};


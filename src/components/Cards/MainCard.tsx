"use client";
// material-ui
import { useTheme } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import { Divider, IconButton, Tooltip } from "@mui/material";
import React, { forwardRef, Ref } from "react";

// header style
const headerSX = {
    p: '18px 24px 14px 24px',
    pb: 1.5,
    '& .MuiCardHeader-action': { m: '0px auto', alignSelf: 'center' },
    '& .MuiCardHeader-title': {
        fontSize: '15px',
        fontWeight: 700,
        color: '#1F2937',
        letterSpacing: '-0.01em'
    }
};

const MainCard = forwardRef(({
    border = true,
    boxShadow,
    children,
    subheader,
    content = true,
    contentSX = {},
    darkTitle,
    divider = false,
    elevation,
    secondary,
    shadow,
    sx = {},
    title,
    modal = false,
    onClose,
    ...others
}: {
    border?: boolean,
    boxShadow?: boolean,
    children?: React.ReactNode,
    subheader?: React.ReactNode,
    content?: boolean,
    contentSX?: object,
    darkTitle?: boolean,
    divider?: boolean,
    elevation?: number,
    secondary?: React.ReactNode,
    shadow?: string,
    sx?: object,
    title?: React.ReactNode,
    modal?: boolean,
    onClose?: () => void
}, ref: Ref<HTMLDivElement>) => {
    const theme = useTheme();

    return (
        <Card
            elevation={0}
            ref={ref}
            {...others}
            sx={{
                position: 'relative',
                bgcolor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '14px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.15s ease',
                ...(!title && { p: 0 }),
                ...(modal && {
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: { xs: `calc( 100% - 50px)`, sm: 'auto' },
                    '& .MuiCardContent-root': {
                        overflowY: 'auto',
                        minHeight: 'auto',
                        maxHeight: `calc(100vh - 200px)`
                    }
                }),
                ...sx
            }}
        >
            {/* Botón cerrar en modal */}
            {/* Botón cerrar en modal */}
            {modal && onClose && (
                <Tooltip title="Cerrar">
                    <IconButton
                        aria-label="Cerrar"
                        onClick={onClose}
                        sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            zIndex: 1,
                            color: '#6B7280',
                            '&:hover': {
                                bgcolor: '#F3F4F6',
                                color: '#1F2937'
                            }
                        }}
                    >
                        <i className="fa-solid fa-xmark" />
                    </IconButton>
                </Tooltip>
            )}
            
            {/* card header and action */}
            {!darkTitle && title && (
                <CardHeader
                    sx={headerSX}
                    titleTypographyProps={{
                        variant: 'h6',
                        sx: {
                            fontSize: '15px',
                            fontWeight: 700,
                            color: '#1F2937',
                            letterSpacing: '-0.01em'
                        }
                    }}
                    title={title}
                    action={secondary}
                    subheader={subheader}
                />
            )}
            {darkTitle && title &&
                <CardHeader
                    sx={headerSX}
                    title={
                        <Typography
                            variant="h4"
                            sx={{
                                fontSize: '16px',
                                fontWeight: 700,
                                color: '#1F2937',
                                letterSpacing: '-0.01em'
                            }}
                        >
                            {title}
                        </Typography>
                    }
                    action={secondary}
                />
            }

            {/* content & header divider */}
            {title && divider && <Divider sx={{ borderColor: '#E5E7EB' }} />}

            {/* card content */}
            {content && <CardContent sx={{ p: '14px 24px 20px 24px', ...contentSX }}>{children}</CardContent>}
            {!content && children}
        </Card>
    );
});

MainCard.displayName = 'MainCard';

export default MainCard;
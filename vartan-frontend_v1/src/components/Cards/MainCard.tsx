"use client";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import { Divider, IconButton, Tooltip } from "@mui/material";
import React, { forwardRef, Ref } from "react";

const headerSX = {
    p: { xs: '14px 18px 12px 18px', sm: '18px 24px 14px 24px' },
    pb: 1.5,
    '& .MuiCardHeader-action': { m: '0px auto', alignSelf: 'center' },
    '& .MuiCardHeader-title': {
        fontSize: { xs: '14px', sm: '15px' },
        fontWeight: 700,
        color: '#1F2937',
        letterSpacing: '-0.01em'
    }
};

const MainCard = forwardRef(({
    _border = true,
    _boxShadow,
    children,
    subheader,
    content = true,
    contentSX = {},
    darkTitle,
    divider = false,
    _elevation,
    secondary,
    _shadow,
    sx = {},
    title,
    modal = false,
    onClose,
    ...others
}: {
    _border?: boolean,
    _boxShadow?: boolean,
    children?: React.ReactNode,
    subheader?: React.ReactNode,
    content?: boolean,
    contentSX?: object,
    darkTitle?: boolean,
    divider?: boolean,
    _elevation?: number,
    secondary?: React.ReactNode,
    _shadow?: string,
    sx?: object,
    title?: React.ReactNode,
    modal?: boolean,
    onClose?: () => void
}, ref: Ref<HTMLDivElement>) => {

    return (
        <Card
            elevation={0}
            ref={ref}
            {...others}
            sx={{
                position: 'relative',
                bgcolor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: { xs: '12px', sm: '14px' },
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.15s ease',
                ...(!title && { p: 0 }),
                ...(modal && {
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 80px)', md: 'auto' },
                    maxWidth: { xs: '100%', sm: '90%', md: '800px' },
                    '& .MuiCardContent-root': {
                        overflowY: 'auto',
                        minHeight: 'auto',
                        maxHeight: { xs: 'calc(100vh - 150px)', sm: 'calc(100vh - 200px)' }
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
                        size="small"
                        aria-label="Cerrar"
                        onClick={onClose}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            zIndex: 1,
                            color: '#6B7280',
                            width: 28,
                            height: 28,
                            p: 0.5,
                            '&:hover': {
                                bgcolor: '#F3F4F6',
                                color: '#1F2937'
                            }
                        }}
                    >
                        <i className="fa-solid fa-xmark" style={{ fontSize: '12px' }} />
                    </IconButton>
                </Tooltip>
            )}
            
            {/* card header and action */}
            {!darkTitle && title && (
                <CardHeader
                    sx={headerSX}
                    slotProps={{
                        title: {
                            variant: 'h6',
                            sx: {
                                fontSize: '15px',
                                fontWeight: 700,
                                color: '#1F2937',
                                letterSpacing: '-0.01em'
                            }
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
                                fontSize: { xs: '14px', sm: '16px' },
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
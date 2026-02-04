"use client";
import {Button, ButtonProps, styled} from "@mui/material";
import Typography from "@mui/material/Typography";
import React from "react";
import Badge, {badgeClasses} from '@mui/material/Badge';

type StyledButtonProps = ButtonProps & {
    icon: React.ReactNode;
    text: string;
    badge?: number;
    badgeColor?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
};

const StyledBadge = styled(Badge)(({theme}) => ({
    [`& .${badgeClasses.badge}`]: {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        fontSize: "0.8rem"
    },
}));

const StyledButton = styled(Button)(({theme}) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(2),
    border: '1.6px solid',
    borderRadius: theme.shape.borderRadius,
    borderColor: theme.palette.mode === 'dark' ? theme.palette.grey[200] : theme.palette.grey[300],
    boxShadow: theme.palette.mode === 'dark' ? theme.customShadows.z1 : 'inherit',
    backgroundColor: theme.palette.background.paper,
    '&:hover': {
        backgroundColor: theme.palette.grey[200],
    },
    width: '100%',
    color: theme.palette.text.primary,
}));

export default function ButtonCard({icon, text, badge, badgeColor, ...props}: StyledButtonProps) {
    return (
        <StyledBadge
            badgeContent={badge}
            color={badgeColor}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            sx={{width: '100%'}}
            overlap="rectangular"
        >
            <StyledButton {...props}>
                <Typography variant="h2" sx={{
                    marginBottom: 1,
                    color: "primary.main"
                }}>{icon}</Typography>
                <Typography variant="h5">{text}</Typography>
            </StyledButton>
        </StyledBadge>
    )
}
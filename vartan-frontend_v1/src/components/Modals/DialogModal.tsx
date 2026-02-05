import React from "react";
import AnimatedModal from "@components/Modals/AnimatedModal";
import {Button, CardContent, Stack} from "@mui/material";
import MainCard from "@components/Cards/MainCard";
import { colors } from '@/src/theme/colors';

export default function DialogModal({
                                        title,
                                        open,
                                        handleClose,
                                        handleSubmit,
                                        submitText,
                                        children,
                                        isLoading = false,
                                        color = "error",
                                    }: {
    title: string,
    open: boolean,
    handleClose: () => void,
    handleSubmit: () => void,
    submitText: string,
    isLoading?: boolean,
    children: React.ReactNode,
    color?: "error" | "secondary" | "inherit" | "primary" | "success" | "info" | "warning",
}) {
    return (
        <AnimatedModal
            open={open}
            onClose={handleClose}
        >
            <MainCard modal darkTitle content={false} title={title} sx={{width: "50%", zIndex: 9999}} onClose={handleClose}>
                <CardContent>
                    {children}
                </CardContent>
                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{px: 2.5, py: 2.5, borderTop: 'none'}}>
                    <Button
                        size="medium"
                        onClick={handleClose}
                        sx={{
                            color: '#6B7280',
                            backgroundColor: 'transparent',
                            border: 'none',
                            textTransform: 'none',
                            fontWeight: 400,
                            fontSize: '14px',
                            px: 2,
                            '&:hover': {
                                backgroundColor: 'rgba(107, 114, 128, 0.08)',
                                border: 'none'
                            }
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        size="medium"
                        onClick={handleSubmit}
                        disabled={isLoading}
                        sx={{
                            backgroundColor: colors.primary,
                            color: 'white',
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '14px',
                            px: 3,
                            py: 1,
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                            '&:hover': {
                                backgroundColor: colors.primaryDark,
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            },
                            '&:disabled': {
                                backgroundColor: '#E5E7EB',
                                color: '#9CA3AF'
                            }
                        }}
                    >
                        {submitText}
                    </Button>
                </Stack>
            </MainCard>
        </AnimatedModal>
    );
}
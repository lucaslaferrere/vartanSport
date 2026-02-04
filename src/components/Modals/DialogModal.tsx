import React from "react";
import AnimatedModal from "@components/Modals/AnimatedModal";
import {Button, CardContent, Divider, Stack} from "@mui/material";
import MainCard from "@components/Cards/MainCard";

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
                <Divider/>
                <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{px: 2.5, py: 2}}>
                    <Button color="primary" size="small" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleSubmit}
                        disabled={isLoading}
                        color={color}
                    >
                        {submitText}
                    </Button>
                </Stack>
            </MainCard>
        </AnimatedModal>
    );
}
// material-ui
import { Box } from '@mui/material';
import Grid from '@mui/material/Grid';
import React from "react";
import AuthCard from "@components/Auth/AuthCard";

// ==============================|| AUTHENTICATION - WRAPPER ||============================== //

const AuthWrapper = ({ children }: {
    children: React.ReactNode
}) => (
    <Box sx={{
        minHeight: '100vh',
        backgroundImage: `linear-gradient(rgba(0, 0, 0,0.5),rgba(0, 0, 0, 0.5)) , url(/background.login.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: 'black'
    }}>
        <Grid
            container
            direction="column"
            justifyContent="flex-end"
            sx={{
                minHeight: '100vh'
            }}
        >
            <Grid size={{ xs: 12 }}>
                <Grid
                    container
                    justifyContent="center"
                    alignItems="center"
                    sx={{ minHeight: '100vh' }}
                >
                    <Grid>
                        <Box sx={{
                            textAlign: 'center',
                            width: '100%',
                        }}>
                            <img
                                src="/logo.dark.png"
                                alt="Logo"
                                style={{
                                    height: '100px',
                                    zIndex: 1000,
                                    textAlign: 'center',
                                }}
                            />
                        </Box>
                        <AuthCard>{children}</AuthCard>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    </Box>
);

export default AuthWrapper;


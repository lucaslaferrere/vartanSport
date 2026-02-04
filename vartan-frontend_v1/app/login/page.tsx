'use client';

import { Box } from '@mui/material';
import AuthWrapper from '@components/Auth/AuthWrapper';
import AuthCard from '@components/Auth/AuthCard';
import AuthLogin from '@components/Auth/AuthLogin';

export default function LoginPage() {
    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
            <AuthWrapper>
                <AuthCard>
                    <AuthLogin />
                </AuthCard>
            </AuthWrapper>
        </Box>
    );
}


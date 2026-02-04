'use client';

import AuthWrapper from '@components/Auth/AuthWrapper';
import AuthCard from '@components/Auth/AuthCard';
import AuthLogin from '@components/Auth/AuthLogin';

export default function LoginPage() {
  return (
    <AuthWrapper>
      <AuthCard>
        <AuthLogin />
      </AuthCard>
    </AuthWrapper>
  );
}


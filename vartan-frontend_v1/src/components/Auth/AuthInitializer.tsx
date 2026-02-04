'use client';

import { useEffect } from 'react';
import { initializeAuth } from '@libraries/store';

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    } else {
      const expires = new Date();
      expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000);
      document.cookie = `auth-token=${token}; expires=${expires.toUTCString()}; path=/`;
    }
    initializeAuth();
  }, []);

  return <>{children}</>;
}


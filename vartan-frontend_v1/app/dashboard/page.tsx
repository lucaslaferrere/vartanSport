'use client';

import React from 'react';
import { useAuthStore } from '@libraries/store';
import { useMounted } from '@hooks/useMounted';
import DashboardVendedor from '@components/Dashboard/DashboardVendedor';
import DashboardDueno from '@components/Dashboard/DashboardDueno';

export default function DashboardPage() {
  const mounted = useMounted();
  const { user } = useAuthStore();

  if (!mounted) return null;

  if (user?.rol === 'vendedor') {
    return <DashboardVendedor />;
  }

  return <DashboardDueno />;
}


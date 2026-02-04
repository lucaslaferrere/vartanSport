'use client';

import React from 'react';
import { Box, Tabs, Tab, Chip } from '@mui/material';
import colors from '@/src/theme/colors';

interface StatusTab {
  id: string;
  label: string;
  count: number;
  color: 'warning' | 'success' | 'error' | 'default';
}

interface StatusTabsProps {
  tabs: StatusTab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export default function StatusTabs({ tabs, activeTab, onChange }: StatusTabsProps) {
  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    onChange(newValue);
  };

  const getChipColor = (color: string) => {
    switch (color) {
      case 'warning':
        return { bgcolor: colors.warningLight, color: colors.warning };
      case 'success':
        return { bgcolor: colors.successLight, color: colors.success };
      case 'error':
        return { bgcolor: colors.errorLight, color: colors.error };
      default:
        return { bgcolor: 'rgba(107, 114, 128, 0.1)', color: colors.textSecondary };
    }
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: colors.border, mb: 3 }}>
      <Tabs
        value={activeTab}
        onChange={handleChange}
        sx={{
          '& .MuiTabs-indicator': {
            bgcolor: colors.primary,
            height: '3px',
            borderRadius: '3px 3px 0 0',
          },
          '& .MuiTab-root': {
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 500,
            color: colors.textSecondary,
            minHeight: '48px',
            '&.Mui-selected': {
              color: colors.primary,
              fontWeight: 600,
            },
          },
        }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            value={tab.id}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {tab.label}
                <Chip
                  label={tab.count}
                  size="small"
                  sx={{
                    height: '22px',
                    fontSize: '12px',
                    fontWeight: 600,
                    ...getChipColor(tab.color),
                  }}
                />
              </Box>
            }
          />
        ))}
      </Tabs>
    </Box>
  );
}


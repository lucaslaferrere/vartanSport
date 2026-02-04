'use client';

import { ReactNode } from 'react';
import SimpleBar from 'simplebar-react';
import { alpha, styled, SxProps, Theme } from '@mui/material/styles';
import { Box } from '@mui/material';
import 'simplebar-react/dist/simplebar.min.css';

const RootStyle = styled(Box)(() => ({
  flexGrow: 1,
  height: '100%',
  overflow: 'hidden'
}));

const SimpleBarStyle = styled(SimpleBar)(({ theme }) => ({
  maxHeight: '100%',
  '& .simplebar-scrollbar': {
    '&:before': {
      backgroundColor: alpha(theme.palette.grey[500], 0.48)
    },
    '&.simplebar-visible:before': {
      opacity: 1
    }
  },
  '& .simplebar-track.simplebar-vertical': {
    width: 10
  },
  '& .simplebar-track.simplebar-horizontal .simplebar-scrollbar': {
    height: 6
  },
  '& .simplebar-mask': {
    zIndex: 'inherit'
  }
}));

interface SimpleBarScrollProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
}

export default function SimpleBarScroll({ children, sx }: SimpleBarScrollProps) {
  return (
    <RootStyle sx={sx}>
      <SimpleBarStyle clickOnTrack={false}>
        {children}
      </SimpleBarStyle>
    </RootStyle>
  );
}


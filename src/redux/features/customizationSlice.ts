import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface CustomizationState {
  mode: 'light' | 'dark';
  drawerOpen: boolean;
  fontFamily: string;
  logo: string;
  icon: string;
}

const initialState: CustomizationState = {
  mode: 'light',
  drawerOpen: true,
  fontFamily: `'Roboto', sans-serif`,
  logo: '/icono.png',
  icon: '/iconoSmall.png',
};

export const customizationSlice = createSlice({
  name: 'customization',
  initialState,
  reducers: {
    changeMode: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
    },
    setMode: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.mode = action.payload;
    },
    toggleDrawer: (state) => {
      state.drawerOpen = !state.drawerOpen;
    },
    setDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.drawerOpen = action.payload;
    },
  },
});

export const { changeMode, setMode, toggleDrawer, setDrawerOpen } = customizationSlice.actions;
export default customizationSlice.reducer;


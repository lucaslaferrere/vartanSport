import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface NavigationState {
  company: string | null;
  group: string | 'all';
}

const initialState: NavigationState = {
  company: null,
  group: 'all',
};

export const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setCompany: (state, action: PayloadAction<string | null>) => {
      state.company = action.payload;
    },
    setGroup: (state, action: PayloadAction<string | 'all'>) => {
      state.group = action.payload;
    },
    resetNavigation: (state) => {
      state.company = null;
      state.group = 'all';
    },
  },
});

export const { setCompany, setGroup, resetNavigation } = navigationSlice.actions;
export default navigationSlice.reducer;


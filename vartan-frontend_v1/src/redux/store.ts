import { configureStore } from '@reduxjs/toolkit';
import customizationReducer from './features/customizationSlice';
import navigationReducer from './features/navigationSlice';

export const store = configureStore({
  reducer: {
    customization: customizationReducer,
    navigation: navigationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


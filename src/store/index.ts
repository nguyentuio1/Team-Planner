import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import projectSlice from './slices/projectSlice';
import taskSlice from './slices/taskSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    projects: projectSlice,
    tasks: taskSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
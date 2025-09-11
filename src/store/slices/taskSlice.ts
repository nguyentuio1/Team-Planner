import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { TaskState, Task, Milestone } from '../../types';

const initialState: TaskState = {
  tasks: [],
  milestones: [],
  loading: false,
  error: null,
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
      state.loading = false;
      state.error = null;
    },
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks.push(action.payload);
    },
    updateTask: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(t => t.taskId === action.payload.taskId);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(t => t.taskId !== action.payload);
    },
    setMilestones: (state, action: PayloadAction<Milestone[]>) => {
      state.milestones = action.payload;
    },
    addMilestone: (state, action: PayloadAction<Milestone>) => {
      state.milestones.push(action.payload);
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setTasks,
  addTask,
  updateTask,
  deleteTask,
  setMilestones,
  addMilestone,
  setError,
  clearError,
} = taskSlice.actions;

export default taskSlice.reducer;
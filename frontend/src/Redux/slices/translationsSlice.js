import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import staticContent from '../../locales/en/translationEN.json';
export const fetchDynamicContent = createAsyncThunk(
  'content/fetchDynamicContent',
  async () => {
    try {
      const response = await fetch('/api/content');
      if (!response.ok) throw new Error('Failed to fetch dynamic content');
      return await response.json();
    } catch (error) {
      console.error(
        'Failed to fetch dynamic content, using static fallback',
        error
      );
      return staticContent;
    }
  }
);

const contentSlice = createSlice({
  name: 'content',
  initialState: {
    dynamicContent: staticContent,
    status: 'idle',
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDynamicContent.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDynamicContent.fulfilled, (state, action) => {
        state.dynamicContent = action.payload;
        state.status = 'succeeded';
      })
      .addCase(fetchDynamicContent.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export default contentSlice.reducer;

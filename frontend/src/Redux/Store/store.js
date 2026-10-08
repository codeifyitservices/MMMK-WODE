import { configureStore } from '@reduxjs/toolkit';
import translationsReducer from '../slices/translationsSlice';

const store = configureStore({
  reducer: {
    translations: translationsReducer,
  },
});

export default store;

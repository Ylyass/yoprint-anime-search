import { configureStore } from '@reduxjs/toolkit'
import animeReducer from '../features/anime/animeSlice.ts'
import searchReducer from '../features/search/searchSlice.ts'

export const store = configureStore({
  reducer: {
    search: searchReducer,
    anime: animeReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch


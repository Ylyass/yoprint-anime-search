import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store.ts'
import type { JikanAnimeDetail } from '../../types/jikan.ts'

interface JikanAnimeResponse {
  data: JikanAnimeDetail
}

export interface AnimeState {
  current: JikanAnimeDetail | null
  loading: boolean
  error: string | null
}

const initialState: AnimeState = {
  current: null,
  loading: false,
  error: null,
}

const buildErrorMessage = (status: number, fallback: string) => {
  if (status === 429) {
    return 'Too many requests. The Jikan API is rate limiting right now. Please try again shortly.'
  }

  if (status === 404) {
    return 'We could not find that anime. Please try another one.'
  }

  return fallback
}

export const fetchAnimeById = createAsyncThunk<JikanAnimeDetail, number>(
  'anime/fetchById',
  async (malId, thunkAPI) => {
    const { signal } = thunkAPI
    const response = await fetch(
      `https://api.jikan.moe/v4/anime/${malId}/full`,
      { signal },
    )

    if (!response.ok) {
      let detail = `Request failed with status ${response.status}`
      try {
        const errorBody = (await response.json()) as { message?: string }
        if (errorBody?.message) {
          detail = errorBody.message
        }
      } catch {
        // ignore parse errors
      }

      throw new Error(buildErrorMessage(response.status, detail))
    }

    const data = (await response.json()) as JikanAnimeResponse
    return data.data
  },
)

const animeSlice = createSlice({
  name: 'anime',
  initialState,
  reducers: {
    clearCurrent: (state) => {
      state.current = null
      state.error = null
      state.loading = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnimeById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAnimeById.fulfilled, (state, action) => {
        state.loading = false
        state.current = action.payload
      })
      .addCase(fetchAnimeById.rejected, (state, action) => {
        state.loading = false
        if (action.error.name === 'AbortError' || action.meta.aborted) {
          return
        }
        state.error =
          action.error.message ?? 'Something went wrong while loading details.'
      })
  },
})

export const { clearCurrent } = animeSlice.actions

export const selectAnime = (state: RootState) => state.anime

export default animeSlice.reducer


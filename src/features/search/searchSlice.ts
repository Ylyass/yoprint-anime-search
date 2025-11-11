import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store.ts'
import type {
  JikanAnimeListEntry,
  JikanAnimeSearchResponse,
} from '../../types/jikan.ts'
import { fetchWithRetry } from '../../utils/fetchWithRetry.ts'

const SEARCH_LIMIT = 12
const SUGGESTION_LIMIT = 6

export type AnimeSummary = JikanAnimeListEntry

const throwIfAborted = (signal: AbortSignal) => {
  if (signal.aborted) {
    const abortError = new Error('Aborted')
    abortError.name = 'AbortError'
    throw abortError
  }
}

export interface SearchState {
  query: string
  page: number
  status: 'idle' | 'loading' | 'error'
  error?: string
  results: AnimeSummary[]
  suggestions: AnimeSummary[]
  suggestionsStatus: 'idle' | 'loading' | 'error'
  suggestionsError?: string
  totalPages: number
  lastUpdated?: string
}

const initialState: SearchState = {
  query: '',
  page: 1,
  status: 'idle',
  results: [],
  suggestions: [],
  suggestionsStatus: 'idle',
  totalPages: 1,
}

export interface FetchSearchArgs {
  query: string
  page: number
}

export interface FetchSuggestionsArgs {
  query: string
  limit?: number
}

interface JikanErrorPayload {
  message?: string
}

const buildSearchUrl = ({ query, page }: FetchSearchArgs) => {
  const params = new URLSearchParams({
    q: query,
    page: page.toString(),
    limit: SEARCH_LIMIT.toString(),
    sfw: 'true',
  })

  return `https://api.jikan.moe/v4/anime?${params.toString()}`
}

const buildSuggestionsUrl = ({ query, limit = SUGGESTION_LIMIT }: FetchSuggestionsArgs) => {
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
    order_by: 'popularity',
    sort: 'asc',
    sfw: 'true',
  })

  return `https://api.jikan.moe/v4/anime?${params.toString()}`
}

const buildErrorMessage = (status: number, fallback: string) => {
  if (status === 429) {
    return 'Too many requests. The Jikan API is rate limiting right now. Please try again in a moment.'
  }

  return fallback
}

export const fetchSearch = createAsyncThunk<
  JikanAnimeSearchResponse,
  FetchSearchArgs
>('search/fetchSearch', async (args, thunkAPI) => {
  const { signal } = thunkAPI
  throwIfAborted(signal)

  const response = await fetchWithRetry(buildSearchUrl(args), {
    signal,
    retries: 2,
    retryDelayMs: 1400,
  })

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`
    try {
      const errorBody = (await response.json()) as JikanErrorPayload
      if (errorBody?.message) {
        detail = errorBody.message
      }
    } catch {
      // ignore parse errors
    }

    throw new Error(buildErrorMessage(response.status, detail))
  }

  const data = (await response.json()) as JikanAnimeSearchResponse
  return data
})

export const fetchSuggestions = createAsyncThunk<
  AnimeSummary[],
  FetchSuggestionsArgs
>('search/fetchSuggestions', async (args, thunkAPI) => {
  const { signal } = thunkAPI
  throwIfAborted(signal)

  const response = await fetchWithRetry(buildSuggestionsUrl(args), {
    signal,
    retries: 1,
    retryDelayMs: 1400,
  })

  if (!response.ok) {
    let detail = `Suggestion request failed with status ${response.status}`
    try {
      const errorBody = (await response.json()) as JikanErrorPayload
      if (errorBody?.message) {
        detail = errorBody.message
      }
    } catch {
      // ignore parse errors
    }

    throw new Error(buildErrorMessage(response.status, detail))
  }

  const data = (await response.json()) as JikanAnimeSearchResponse
  return data.data
})

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload
      state.page = 1
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload
    },
    clearError: (state) => {
      state.error = undefined
      state.status = 'idle'
    },
    clearSuggestions: (state) => {
      state.suggestions = []
      state.suggestionsStatus = 'idle'
      state.suggestionsError = undefined
    },
    completeSuggestionSelection: (state) => {
      state.suggestions = []
      state.suggestionsStatus = 'idle'
      state.suggestionsError = undefined
      state.status = 'idle'
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSearch.pending, (state) => {
        state.status = 'loading'
        state.error = undefined
      })
      .addCase(fetchSearch.fulfilled, (state, action) => {
        state.status = 'idle'
        state.results = action.payload.data
        state.totalPages = Math.max(action.payload.pagination?.last_visible_page ?? 1, 1)
        state.page = action.meta.arg.page
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(fetchSearch.rejected, (state, action) => {
        if (action.error.name === 'AbortError' || action.meta.aborted) {
          return
        }
        state.status = 'error'
        state.error = action.error.message ?? 'Something went wrong while searching.'
      })
      .addCase(fetchSuggestions.pending, (state) => {
        state.suggestionsStatus = 'loading'
        state.suggestionsError = undefined
      })
      .addCase(fetchSuggestions.fulfilled, (state, action) => {
        state.suggestionsStatus = 'idle'
        state.suggestions = action.payload
      })
      .addCase(fetchSuggestions.rejected, (state, action) => {
        if (action.error.name === 'AbortError' || action.meta.aborted) {
          return
        }
        state.suggestionsStatus = 'error'
        state.suggestions = []
        state.suggestionsError =
          action.error.message ?? 'Unable to load suggestions right now.'
      })
  },
})

export const {
  setQuery,
  setPage,
  clearError,
  clearSuggestions,
  completeSuggestionSelection,
} = searchSlice.actions

export const selectSearch = (state: RootState) => state.search
export const selectSuggestions = (state: RootState) => state.search.suggestions
export const selectStatus = (state: RootState) => state.search.status
export const selectQuery = (state: RootState) => state.search.query

export default searchSlice.reducer


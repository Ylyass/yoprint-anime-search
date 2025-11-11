import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Portal,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useLocation, useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar.tsx'
import PaginationChips from '../components/PaginationChips.tsx'
import PosterTile, {
  POSTER_TILE_WIDTH,
  PosterTileSkeleton,
  type PosterTileData,
} from '../components/PosterTile.tsx'
import PopularCarousel from '../components/PopularCarousel.tsx'
import { useAppDispatch, useAppSelector } from '../app/hooks.ts'
import {
  clearError,
  fetchSearch,
  fetchSuggestions,
  selectSearch,
  selectSuggestions,
  selectStatus,
  selectQuery,
  setPage,
  setQuery,
  clearSuggestions,
  completeSuggestionSelection,
} from '../features/search/searchSlice.ts'
import type { JikanAnimeListEntry, JikanAnimeSearchResponse } from '../types/jikan.ts'
import { fetchWithRetry } from '../utils/fetchWithRetry.ts'
import { useSearchExperience } from '../contexts/SearchExperienceContext.tsx'

const SUGGESTION_THRESHOLD = 2
const SUGGESTION_DEBOUNCE_MS = 250
const RECENTLY_VIEWED_KEY = 'recently_viewed_anime'
const SECTION_RADIUS = 12

const genreFilters = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
]

type CollectionStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

interface CollectionState {
  items: PosterTileData[]
  status: CollectionStatus
  error: string | null
}

const createCollectionState = (): CollectionState => ({
  items: [],
  status: 'idle',
  error: null,
})

const toPosterTileData = (anime: JikanAnimeListEntry): PosterTileData => ({
  mal_id: anime.mal_id,
  url: anime.url,
  title: anime.title,
  title_english: anime.title_english,
  title_japanese: anime.title_japanese,
  titles: anime.titles,
  images: anime.images,
})

const readRecentlyViewed = (): PosterTileData[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(RECENTLY_VIEWED_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed as PosterTileData[]
  } catch {
    return []
  }
}

const tileGridStyles = {
  display: 'grid',
  gap: { xs: 1.6, sm: 1.8, md: 2.2 },
  alignItems: 'start',
  justifyItems: 'stretch',
  gridTemplateColumns: 'repeat(auto-fit, minmax(var(--poster-tile-width, 140px), 1fr))',
  '--poster-tile-width': POSTER_TILE_WIDTH,
} as const

const SearchPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const isDesktop = useMediaQuery('(min-width:768px)')
  const searchExperience = useSearchExperience()

  const query = useAppSelector(selectQuery)
  const status = useAppSelector(selectStatus)
  const suggestions = useAppSelector(selectSuggestions)
  const {
    page,
    results,
    totalPages,
    error,
    suggestionsStatus: storeSuggestionsStatus,
    suggestionsError: storeSuggestionsError,
  } = useAppSelector(selectSearch)

  const [localQuery, setLocalQuery] = useState(query)
  const [isDebouncing, setIsDebouncing] = useState(false)

  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)

  const [trending, setTrending] = useState<CollectionState>(createCollectionState)
  const [seasonal, setSeasonal] = useState<CollectionState>(createCollectionState)
  const [topRated, setTopRated] = useState<CollectionState>(createCollectionState)
  const [recentlyViewed, setRecentlyViewed] = useState<PosterTileData[]>([])

  const abortRef = useRef<(() => void) | null>(null)
  const debounceTimerRef = useRef<number | null>(null)
  const suggestionTimerRef = useRef<number | null>(null)
  const suggestionsAbortRef = useRef<(() => void) | null>(null)
  const presenterRef = useRef<HTMLDivElement | null>(null)

  const heroSurfaceRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const normalizedQuery = localQuery.trim()
  const suggestionItems = suggestions
  const suggestionStatus = storeSuggestionsStatus
  const suggestionError = storeSuggestionsError
  const isResultsLoading = status === 'loading'

  const updateAnchorRect = useCallback(() => {
    if (!searchInputRef.current) {
      setAnchorRect(null)
      return
    }

    setAnchorRect(searchInputRef.current.getBoundingClientRect())
  }, [])

  useLayoutEffect(() => {
    updateAnchorRect()
  }, [updateAnchorRect])

  useEffect(() => {
    if (suggestionsOpen) {
      updateAnchorRect()
    }
  }, [suggestionsOpen, updateAnchorRect])

  const closeSuggestions = useCallback(
    (options?: { clearItems?: boolean }) => {
      setSuggestionsOpen(false)
      setHighlightedIndex(-1)
      if (options?.clearItems) {
        dispatch(clearSuggestions())
      }
    },
    [dispatch],
  )

  const openSuggestions = useCallback(() => {
    setSuggestionsOpen(true)
  }, [])

  const clearInFlight = useCallback(() => {
    if (abortRef.current) {
      abortRef.current()
      abortRef.current = null
    }
  }, [])

  const executeSearch = useCallback(
    (nextQuery: string, nextPage: number) => {
      clearInFlight()
      dispatch(clearError())
      const result = dispatch(fetchSearch({ query: nextQuery, page: nextPage }))
      if (typeof (result as unknown as { abort?: () => void }).abort === 'function') {
        abortRef.current = (result as unknown as { abort: () => void }).abort
      } else {
        abortRef.current = null
      }
      setIsDebouncing(false)
    },
    [clearInFlight, dispatch],
  )

  useEffect(() => {
    let active = true
    const controllers = {
      trending: new AbortController(),
      seasonal: new AbortController(),
      rated: new AbortController(),
    }

    const fetchCollection = async (
      url: string,
      limit: number,
      setter: React.Dispatch<React.SetStateAction<CollectionState>>,
      controller: AbortController,
    ) => {
      setter({ items: [], status: 'loading', error: null })

      try {
        const response = await fetchWithRetry(url, {
          signal: controller.signal,
          retries: 2,
          retryDelayMs: 1400,
        })
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const payload = (await response.json()) as JikanAnimeSearchResponse
        if (!active) {
          return
        }

        setter({
          items: payload.data.slice(0, limit).map(toPosterTileData),
          status: 'succeeded',
          error: null,
        })
      } catch (requestError) {
        if (!active || (requestError as Error).name === 'AbortError') {
          return
        }

        const message =
          requestError instanceof Error
            ? requestError.message.includes('429')
              ? 'Too many requests. Please try again shortly.'
              : requestError.message
            : 'Failed to load data.'

        setter({
          items: [],
          status: 'failed',
          error: message,
        })

        if (message.includes('Too many requests')) {
          setTimeout(() => {
            fetchCollection(url, limit, setter, controller)
          }, 2000)
        }
      }
    }

    const loadCollections = async () => {
      const pause = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

      await fetchCollection(
        'https://api.jikan.moe/v4/top/anime?limit=20',
        20,
        setTrending,
        controllers.trending,
      )

      if (!active) {
        return
      }

      await pause(350)

      await fetchCollection(
        'https://api.jikan.moe/v4/seasons/now?limit=12',
        12,
        setSeasonal,
        controllers.seasonal,
      )

      if (!active) {
        return
      }

      await pause(350)

      await fetchCollection(
        'https://api.jikan.moe/v4/top/anime?limit=12&order_by=score&sort=desc',
        12,
        setTopRated,
        controllers.rated,
      )
    }

    void loadCollections()

    if (typeof window !== 'undefined') {
      setRecentlyViewed(readRecentlyViewed())
    }

    const handleStorage = () => {
      if (typeof window === 'undefined') {
        return
      }
      setRecentlyViewed(readRecentlyViewed())
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage)
    }

    return () => {
      active = false
      controllers.trending.abort()
      controllers.seasonal.abort()
      controllers.rated.abort()
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage)
      }
    }
  }, [])

  useEffect(() => {
    if (!debounceTimerRef.current) {
      return () => undefined
    }

    return () => {
      window.clearTimeout(debounceTimerRef.current as number)
      debounceTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current)
    }

    setIsDebouncing(true)
    const timeoutId = window.setTimeout(() => {
      if (normalizedQuery !== query) {
        dispatch(setQuery(normalizedQuery))
        executeSearch(normalizedQuery, 1)
      } else {
        setIsDebouncing(false)
      }
    }, SUGGESTION_DEBOUNCE_MS) as unknown as number

    debounceTimerRef.current = timeoutId

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [dispatch, executeSearch, normalizedQuery, query])

  useEffect(() => {
    setLocalQuery(query)
  }, [query])

  useEffect(() => {
    closeSuggestions({ clearItems: true })
  }, [closeSuggestions, location.pathname])

  useEffect(() => {
    if (suggestionTimerRef.current) {
      window.clearTimeout(suggestionTimerRef.current)
      suggestionTimerRef.current = null
    }

    if (suggestionsAbortRef.current) {
      suggestionsAbortRef.current()
      suggestionsAbortRef.current = null
    }

    if (normalizedQuery.length < SUGGESTION_THRESHOLD) {
      closeSuggestions({ clearItems: true })
      return () => undefined
    }

    suggestionTimerRef.current = window.setTimeout(() => {
      openSuggestions()
      setHighlightedIndex(-1)
      updateAnchorRect()

      const result = dispatch(fetchSuggestions({ query: normalizedQuery }))
      const abortable = result as unknown as { abort?: () => void }
      if (typeof abortable.abort === 'function') {
        suggestionsAbortRef.current = () => abortable.abort()
      }
    }, SUGGESTION_DEBOUNCE_MS) as unknown as number

    return () => {
      if (suggestionTimerRef.current) {
        window.clearTimeout(suggestionTimerRef.current)
        suggestionTimerRef.current = null
      }
      if (suggestionsAbortRef.current) {
        suggestionsAbortRef.current()
        suggestionsAbortRef.current = null
      }
    }
  }, [closeSuggestions, dispatch, normalizedQuery, openSuggestions, updateAnchorRect])

  useEffect(() => {
    if (!suggestionsOpen) {
      return
    }

    if (suggestionItems.length === 0) {
      setHighlightedIndex(-1)
      return
    }

    if (highlightedIndex < 0 || highlightedIndex >= suggestionItems.length) {
      setHighlightedIndex(0)
    }
  }, [highlightedIndex, suggestionItems.length, suggestionsOpen])

  useEffect(() => {
    if (!suggestionsOpen) {
      return () => undefined
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (presenterRef.current?.contains(target)) {
        return
      }
      if (searchInputRef.current && searchInputRef.current.contains(target as Node)) {
        return
      }

      closeSuggestions()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [closeSuggestions, suggestionsOpen])

  const setSearchActive = searchExperience?.setSearchActive

  useEffect(() => {
    if (typeof document === 'undefined') {
      return () => undefined
    }

    const previousOverflow = document.body.style.overflow

    if (suggestionsOpen && !isDesktop) {
      document.body.style.overflow = 'hidden'
    }

    setSearchActive?.(suggestionsOpen)

    return () => {
      document.body.style.overflow = previousOverflow
      setSearchActive?.(false)
    }
  }, [isDesktop, setSearchActive, suggestionsOpen])

  useLayoutEffect(() => {
    if (!suggestionsOpen) {
      return () => undefined
    }

    updateAnchorRect()
    const handleReposition = () => {
      updateAnchorRect()
    }

    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)

    return () => {
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
    }
  }, [suggestionsOpen, updateAnchorRect])

  useEffect(() => {
    if (!suggestionsOpen) {
      return () => undefined
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeSuggestions()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeSuggestions, suggestionsOpen])

  const handleInputChange = useCallback((value: string) => {
    setLocalQuery(value)
  }, [])

  const handleClear = useCallback(() => {
    setLocalQuery('')
    dispatch(setQuery(''))
    executeSearch('', 1)
    setIsDebouncing(false)
    closeSuggestions({ clearItems: true })
  }, [closeSuggestions, dispatch, executeSearch])

  const handleNavigateToAnime = useCallback(
    (anime: PosterTileData) => {
      navigate(`/anime/${anime.mal_id}`)
    },
    [navigate],
  )

  const handleQuickSearch = useCallback(
    (value: string) => {
      setLocalQuery(value)
      dispatch(setQuery(value))
      executeSearch(value, 1)
      setIsDebouncing(false)
      closeSuggestions({ clearItems: true })
      searchInputRef.current?.focus()
    },
    [closeSuggestions, dispatch, executeSearch],
  )

  const handleSuggestionSelect = useCallback(
    (entry: JikanAnimeListEntry) => {
      const nextQuery =
        entry.title_english || entry.title || entry.title_japanese || localQuery
      setLocalQuery(nextQuery)
      dispatch(setQuery(nextQuery))
      dispatch(completeSuggestionSelection())
      closeSuggestions()
      navigate(`/anime/${entry.mal_id}`)
    },
    [closeSuggestions, dispatch, localQuery, navigate],
  )

  const handlePageChange = useCallback(
    (_: unknown, value: number) => {
      if (value === page) {
        return
      }

      dispatch(setPage(value))
      executeSearch(query, value)
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
    },
    [dispatch, executeSearch, page, prefersReducedMotion, query],
  )

  const handleSuggestionKeyNavigation = useCallback(
    (event: KeyboardEvent) => {
      if (!suggestionsOpen && suggestionItems.length === 0 && suggestionStatus !== 'loading') {
        return
      }

      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault()
          if (!suggestionsOpen) {
            setSuggestionsOpen(true)
            setHighlightedIndex(suggestionItems.length > 0 ? 0 : -1)
            return
          }

          setHighlightedIndex((prev) => {
            if (suggestionItems.length === 0) {
              return -1
            }

            const next = prev < 0 ? 0 : prev + 1
            return next >= suggestionItems.length ? 0 : next
          })
          break
        }
        case 'ArrowUp': {
          if (!suggestionsOpen) {
            return
          }

          event.preventDefault()
          setHighlightedIndex((prev) => {
            if (suggestionItems.length === 0) {
              return -1
            }

            if (prev <= 0) {
              return suggestionItems.length - 1
            }

            return prev - 1
          })
          break
        }
        case 'Enter': {
          if (
            !suggestionsOpen ||
            highlightedIndex < 0 ||
            !suggestionItems[highlightedIndex]
          ) {
            return
          }

          event.preventDefault()
          handleSuggestionSelect(suggestionItems[highlightedIndex])
          break
        }
        case 'Escape': {
          if (!suggestionsOpen) {
            return
          }

          event.preventDefault()
          closeSuggestions()
          break
        }
        default:
      }
    },
    [
      closeSuggestions,
      handleSuggestionSelect,
      highlightedIndex,
      suggestionItems,
      suggestionStatus,
      suggestionsOpen,
    ],
  )

  const handleExploreClick = useCallback(() => {
    heroSurfaceRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }, [prefersReducedMotion])

  useEffect(() => {
    const inputNode = searchInputRef.current
    if (!inputNode) {
      return () => undefined
    }

    const listener = (event: KeyboardEvent) => {
      handleSuggestionKeyNavigation(event)
    }

    inputNode.addEventListener('keydown', listener)

    return () => {
      inputNode.removeEventListener('keydown', listener)
    }
  }, [handleSuggestionKeyNavigation])

  const renderCollectionGrid = (
    collection: CollectionState,
    emptyMessage: string,
  ) => {
    if (collection.status === 'loading') {
      return (
        <Box
          sx={{
            ...tileGridStyles,
          }}
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <PosterTileSkeleton key={`collection-skeleton-${index}`} size="sm" />
          ))}
        </Box>
      )
    }

    if (collection.status === 'failed') {
      return <Alert severity="error">{collection.error}</Alert>
    }

    if (collection.items.length === 0) {
      return (
        <Typography variant="body2" sx={{ color: 'rgba(232, 245, 255, 0.72)' }}>
          {emptyMessage}
        </Typography>
      )
    }

    return (
      <Box
        sx={{
          ...tileGridStyles,
        }}
      >
        {collection.items.map((anime) => (
          <PosterTile
            key={anime.mal_id}
            anime={anime}
            onSelect={handleNavigateToAnime}
            size="sm"
          />
        ))}
      </Box>
    )
  }

  const renderResults = () => {
    if (isResultsLoading) {
      return (
        <Box
          sx={{
            ...tileGridStyles,
          }}
        >
          {Array.from({ length: 12 }).map((_, index) => (
            <PosterTileSkeleton key={`results-skeleton-${index}`} size="sm" />
          ))}
        </Box>
      )
    }

    if (results.length === 0) {
      return (
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 10,
            px: { xs: 3, sm: 6 },
            py: { xs: 6, sm: 8 },
            background: 'rgba(12, 18, 28, 0.68)',
            border: '1px solid rgba(0, 245, 255, 0.12)',
            backdropFilter: 'blur(22px)',
            textAlign: 'center',
            maxWidth: 720,
            mx: 'auto',
            boxShadow: '0 34px 92px rgba(0, 39, 76, 0.38)',
          }}
        >
          <Stack spacing={1.5} alignItems="center">
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              No results found. Try searching for popular titles like Naruto, Bleach, or Spy × Family.
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 520 }}
              align="center"
            >
              Our neon assistant is still scanning the databanks—pick a spotlighted title below to jump back in.
            </Typography>
            <Stack
              direction="row"
              spacing={1.5}
              justifyContent="center"
              sx={{ flexWrap: 'wrap', gap: 1.5 }}
            >
              {['Naruto', 'Bleach', 'Spy × Family'].map((example) => (
                <Button
                  key={example}
                  onClick={() => handleQuickSearch(example)}
                  variant="outlined"
                  sx={{
                    borderRadius: 8,
                    borderColor: 'rgba(0,245,255,0.38)',
                    color: '#e8f5ff',
                    background:
                      'linear-gradient(135deg, rgba(0,245,255,0.18), rgba(255,74,187,0.16))',
                    boxShadow: '0 14px 36px rgba(0, 245, 255, 0.22)',
                    px: 2.6,
                    py: 1,
                  }}
                >
                  {example}
                </Button>
              ))}
            </Stack>
          </Stack>
        </Box>
      )
    }

    return (
      <Box
        sx={{
          ...tileGridStyles,
        }}
      >
        {results.map((anime) => (
          <PosterTile
            key={anime.mal_id}
            anime={toPosterTileData(anime)}
            onSelect={handleNavigateToAnime}
            size="sm"
          />
        ))}
      </Box>
    )
  }

  const suggestionPresenter = suggestionsOpen ? (
    <Portal>
      <Box
        className="z-dropdown"
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 'var(--z-dropdown, 1000)',
          pointerEvents: 'none',
        }}
      >
        <Box
          role="presentation"
          onClick={() => closeSuggestions()}
          sx={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 10, 18, 0.62)',
            backdropFilter: 'blur(6px)',
            pointerEvents: 'auto',
            touchAction: 'none',
          }}
        />
        <Box
          ref={presenterRef}
          role="listbox"
          aria-label="Search suggestions"
          sx={{
            position: 'fixed',
            top: (anchorRect?.bottom ?? 84) + (isDesktop ? 4 : 0),
            left: isDesktop ? anchorRect?.left ?? 16 : 0,
            right: isDesktop ? 'auto' : 0,
            width: isDesktop
              ? anchorRect
                ? anchorRect.width
                : 'min(96vw, 440px)'
              : '100%',
            height: isDesktop
              ? 'auto'
              : `min(70vh, calc(100vh - ${(anchorRect?.bottom ?? 84).toFixed(
                  0,
                )}px - env(safe-area-inset-bottom, 0px)))`,
            maxHeight: isDesktop
              ? '60vh'
              : `calc(100vh - ${(anchorRect?.bottom ?? 84).toFixed(
                  0,
                )}px - env(safe-area-inset-bottom, 0px))`,
            overflowY: 'auto',
            background: 'rgba(8, 12, 20, 0.96)',
            border: '1px solid rgba(0, 245, 255, 0.18)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)',
            borderRadius: isDesktop ? 12 : '18px 18px 0 0',
            padding: { xs: '16px 18px', sm: '18px 24px', md: '18px 20px' },
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            pointerEvents: 'auto',
            zIndex: 'calc(var(--z-dropdown, 1000) + 1)',
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': {
              width: 6,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(231, 238, 247, 0.25)',
              borderRadius: 999,
            },
            pb: isDesktop ? 2 : 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
          }}
        >
          {suggestionStatus === 'loading' ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Box
                // eslint-disable-next-line react/no-array-index-key
                key={`suggestion-skeleton-${index}`}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  opacity: 0.65,
                  '&::after': {
                    content: '""',
                    display: 'block',
                    width: '70%',
                    height: 12,
                    background:
                      'linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.22), rgba(255,255,255,0.08))',
                    animation: 'posterTileSkeleton 1.4s ease-in-out infinite',
                  },
                }}
              />
            ))
          ) : suggestionItems.length > 0 ? (
            suggestionItems.map((suggestion, index) => {
              const image =
                suggestion.images?.jpg?.small_image_url ||
                suggestion.images?.jpg?.image_url ||
                undefined
              const title =
                suggestion.title_english || suggestion.title || suggestion.title_japanese
              const active = index === highlightedIndex
              const metadata = [
                suggestion.type ?? undefined,
                suggestion.year ?? undefined,
                suggestion.score ? `★ ${suggestion.score.toFixed(1)}` : undefined,
              ]
                .filter(Boolean)
                .join(' · ')

              return (
                <Box
                  key={suggestion.mal_id}
                  component="button"
                  type="button"
                  onClick={() => handleSuggestionSelect(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  role="option"
                  aria-selected={active}
                  sx={{
                    all: 'unset',
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    alignItems: 'center',
                    gap: 16,
                    padding: { xs: '12px 8px', md: '14px 10px' },
                    cursor: 'pointer',
                    borderRadius: 0,
                    borderBottom:
                      index === suggestionItems.length - 1
                        ? 'none'
                        : '1px solid rgba(231, 238, 247, 0.08)',
                    background: active ? 'rgba(0, 245, 255, 0.08)' : 'transparent',
                    transition: 'background 140ms ease',
                    '&:hover': {
                      background: 'rgba(0, 245, 255, 0.12)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 64,
                      borderRadius: 2,
                      overflow: 'hidden',
                      background: 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {image ? (
                      <Box
                        component="img"
                        src={image}
                        alt=""
                        aria-hidden
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Box
                        sx={{ width: '70%', height: '70%', background: 'rgba(255,255,255,0.08)' }}
                      />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                        color: '#f0f6ff',
                        lineHeight: 1.32,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(231, 238, 247, 0.6)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {metadata}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: active
                        ? 'rgba(0, 245, 255, 0.85)'
                        : 'rgba(231, 238, 247, 0.32)',
                      boxShadow: active
                        ? '0 0 14px rgba(0, 245, 255, 0.55)'
                        : '0 0 6px rgba(231, 238, 247, 0.35)',
                    }}
                  />
                </Box>
              )
            })
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(231, 238, 247, 0.7)',
                padding: { xs: '12px 8px', md: '16px 12px' },
              }}
            >
              {suggestionError ?? 'No matches found. Keep typing to refine your search.'}
            </Typography>
          )}
          <Button
            variant="text"
            onClick={() => closeSuggestions()}
            sx={{
              alignSelf: 'flex-end',
              color: 'rgba(231, 238, 247, 0.75)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              mt: 1,
            }}
          >
            Close
          </Button>
        </Box>
      </Box>
    </Portal>
  ) : null

  const contentOpacityClass = useMemo(
    () => (suggestionsOpen ? 'app-dimmed' : undefined),
    [suggestionsOpen],
  )

  return (
    <Box component="section" className="z-content" sx={{ py: 2 }}>
      {suggestionPresenter}
      <Stack spacing={{ xs: 5, md: 6 }} className={contentOpacityClass}>
        <Box
          sx={{
            position: 'relative',
            overflow: 'visible',
            borderRadius: 10,
            px: { xs: 2.5, sm: 3.5, md: 5 },
            py: { xs: 4, sm: 4.5, md: 5.5 },
            background: 'rgba(8, 12, 20, 0.8)',
            border: '1px solid rgba(233, 244, 255, 0.14)',
            boxShadow: '0 28px 90px rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(16px)',
            transition: 'opacity 180ms ease',
          }}
        >
          <Box
            aria-hidden
            className="z-bg pe-none"
            sx={{
              position: 'absolute',
              inset: '-5%',
              backgroundImage:
                'linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: { xs: '140px 140px', md: '160px 160px' },
              opacity: 0.22,
              borderRadius: 10,
            }}
          />
          {!prefersReducedMotion ? (
            <Box
              aria-hidden
              className="z-bg pe-none"
              sx={{
                position: 'absolute',
                inset: '-70% 12% 0 12%',
                background: 'radial-gradient(circle, rgba(0,245,255,0.14) 0%, transparent 55%)',
                opacity: suggestionsOpen ? 0.18 : 0.28,
                filter: 'blur(38px)',
                animation: 'heroStreak 14s ease-in-out infinite',
                borderRadius: 10,
              }}
            />
          ) : null}
          <Stack spacing={{ xs: 4, md: 5 }} alignItems="center" sx={{ position: 'relative', textAlign: 'center' }}>
            <Stack spacing={{ xs: 1.2, md: 1.6 }} alignItems="center">
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: { xs: '0.08em', md: '0.12em' },
                  fontSize: {
                    xs: 'clamp(2.2rem, 8vw, 2.8rem)',
                    md: 'clamp(2.6rem, 5vw, 3.4rem)',
                  },
                  background:
                    'linear-gradient(90deg, rgba(54,224,248,0.92) 0%, rgba(196,92,255,0.92) 45%, rgba(54,224,248,0.92) 100%)',
                  backgroundSize: '220%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'heroTitleSheen 14s linear infinite',
                  pointerEvents: 'none',
                }}
              >
                Anime Search
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(231, 238, 247, 0.78)',
                  maxWidth: 640,
                  lineHeight: 1.7,
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  pointerEvents: 'none',
                }}
              >
                Discover, watch, and fall in love with your next anime adventure. Browse fan-favorite worlds or dive into hidden gems curated for every explorer.
              </Typography>
            </Stack>
            <Stack spacing={2} alignItems="center" sx={{ width: '100%', maxWidth: { xs: '100%', md: 720, lg: 880 } }}>
              <Box
                sx={{
                  width: '100%',
                  position: 'relative',
                  zIndex: theme.zIndex.modal,
                  borderRadius: 0,
                }}
                ref={heroSurfaceRef}
              >
                <SearchBar
                  ref={searchInputRef}
                  value={localQuery}
                  onChange={handleInputChange}
                  onClear={handleClear}
                  isLoading={isResultsLoading || isDebouncing || suggestionStatus === 'loading'}
                  onFocus={(focused) => {
                    if (focused) {
                      updateAnchorRect()
                    }
                  }}
                />
              </Box>
              <Button
                variant="contained"
                size="large"
                onClick={handleExploreClick}
                sx={{
                borderRadius: 10,
                px: { xs: 3.2, md: 4.2 },
                py: { xs: 0.95, md: 1.1 },
                letterSpacing: 1.1,
                textTransform: 'uppercase',
                }}
              >
                Explore Top Anime
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Stack spacing={{ xs: 4, md: 5 }}>
          <Box>
            <PopularCarousel
              title="Top 20 Trending Anime"
              items={trending.items}
              loading={trending.status === 'loading'}
              emptyMessage={
                trending.status === 'failed'
                  ? trending.error ?? 'Unable to load trending anime.'
                  : 'No trending anime available.'
              }
              onSelect={handleNavigateToAnime}
            />
            <Typography
              variant="body2"
              sx={{ color: 'rgba(232, 245, 255, 0.68)', mt: 1.5 }}
            >
              Swipe through today’s most-watched series.
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', mb: 1 }}
            >
              New This Season
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(232, 245, 255, 0.68)', mb: 2 }}>
              Fresh episodes airing right now.
            </Typography>
            {renderCollectionGrid(seasonal, 'No seasonal titles available at the moment.')}
          </Box>

          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', mb: 1 }}
            >
              Top Rated
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(232, 245, 255, 0.68)', mb: 2 }}>
              Critically acclaimed picks with sky-high scores.
            </Typography>
            {renderCollectionGrid(topRated, 'No top-rated titles found right now.')}
          </Box>

          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', mb: 1 }}
            >
              Browse by Genre
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(232, 245, 255, 0.68)', mb: 2 }}>
              Jump straight into the mood you’re craving.
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5 }}>
              {genreFilters.map((genre) => (
                <Button
                  key={genre}
                  variant="outlined"
                  onClick={() => handleQuickSearch(genre)}
                  sx={{
                    borderRadius: 8,
                    borderColor: 'rgba(0,245,255,0.24)',
                    color: '#e8f5ff',
                    px: 2,
                    py: 0.8,
                  }}
                >
                  {genre}
                </Button>
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', mb: 1 }}
            >
              Recently Viewed
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(232, 245, 255, 0.68)', mb: 2 }}>
              Pick up where you left off.
            </Typography>
            {recentlyViewed.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'rgba(232, 245, 255, 0.72)' }}>
                You haven’t opened any anime details yet.
              </Typography>
            ) : (
              <Box
                sx={{
                  ...tileGridStyles,
                }}
              >
                {recentlyViewed.map((anime) => (
                  <PosterTile
                    key={anime.mal_id}
                    anime={anime}
                    onSelect={handleNavigateToAnime}
                    size="sm"
                  />
                ))}
              </Box>
            )}
          </Box>
        </Stack>

        {error ? <Alert severity="error">{error}</Alert> : null}

        {results.length > 0 && (
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}
          >
            All Anime Results
          </Typography>
        )}

        {renderResults()}

        {results.length > 0 && totalPages > 1 ? (
          <PaginationChips count={totalPages} page={page} onChange={handlePageChange} />
        ) : null}
      </Stack>
    </Box>
  )
}

export default SearchPage

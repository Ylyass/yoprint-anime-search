import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Grid,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { keyframes } from '@emotion/react'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks.ts'
import {
  clearCurrent,
  fetchAnimeById,
  selectAnime,
} from '../features/anime/animeSlice.ts'
import type { JikanAnimeDetail } from '../types/jikan.ts'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { POSTER_TILE_ASPECT_RATIO, POSTER_TILE_RADIUS } from '../components/PosterTile.tsx'

type AbortablePromise<T> = Promise<T> & { abort: () => void }

interface StatHighlight {
  label: string
  value: string
  hint?: string
}

const buttonPlume = keyframes`
  0% {
    opacity: 0.25;
    transform: translateY(40%) scale(0.85);
  }
  80% {
    opacity: 0;
    transform: translateY(-40%) scale(1.2);
  }
  100% {
    opacity: 0;
  }
`

const heroScan = keyframes`
  0% {
    opacity: 0;
    transform: translateY(30%);
  }
  40% {
    opacity: 0.35;
  }
  100% {
    opacity: 0;
    transform: translateY(-30%);
  }
`

const pageContainerSx = {
  maxWidth: 1080,
  width: '100%',
  mx: 'auto',
  px: { xs: 2, sm: 3, md: 4 },
}

const infoCellBase = {
  borderRadius: 'var(--radius-card)',
  background: 'rgba(8, 12, 20, 0.78)',
  border: '1px solid rgba(226, 236, 255, 0.14)',
  px: { xs: 1.4, md: 1.8 },
  py: { xs: 1.1, md: 1.3 },
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'minmax(140px, 1fr) minmax(0, 2fr)',
  },
  columnGap: { sm: 2.5 },
  rowGap: { xs: 0.5, sm: 0.4 },
  alignItems: { sm: 'center' },
} as const

const DetailPage = () => {
  const dispatch = useAppDispatch()
  const { current, loading, error } = useAppSelector(selectAnime)
  const { id } = useParams<{ id: string }>()
  const abortRef = useRef<(() => void) | null>(null)
  const heroRef = useRef<HTMLDivElement | null>(null)
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false)

  const clearInFlight = useCallback(() => {
    if (abortRef.current) {
      abortRef.current()
      abortRef.current = null
    }
  }, [])

  const executeFetch = useCallback(
    (animeId: number) => {
      clearInFlight()
      const result = dispatch(fetchAnimeById(animeId))
      if (
        typeof (result as AbortablePromise<JikanAnimeDetail>).abort ===
        'function'
      ) {
        abortRef.current = (
          result as AbortablePromise<JikanAnimeDetail>
        ).abort
      } else {
        abortRef.current = null
      }
    },
    [clearInFlight, dispatch],
  )

  useEffect(() => {
    if (!id) {
      return
    }

    const malId = Number(id)
    if (Number.isNaN(malId)) {
      return
    }

    executeFetch(malId)

    return () => {
      clearInFlight()
      dispatch(clearCurrent())
    }
  }, [clearInFlight, dispatch, executeFetch, id])

  useEffect(() => {
    setIsOverviewExpanded(false)
  }, [current?.mal_id])

  const handleHeroPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || !heroRef.current) {
        return
      }

      const rect = heroRef.current.getBoundingClientRect()
      const offsetX = (event.clientX - rect.left) / rect.width - 0.5
      const offsetY = (event.clientY - rect.top) / rect.height - 0.5

      heroRef.current.style.setProperty('--parallax-x', `${offsetX}`)
      heroRef.current.style.setProperty('--parallax-y', `${offsetY}`)
    },
    [prefersReducedMotion],
  )

  const handleHeroPointerLeave = useCallback(() => {
    if (!heroRef.current) {
      return
    }

    heroRef.current.style.setProperty('--parallax-x', '0')
    heroRef.current.style.setProperty('--parallax-y', '0')
  }, [])

  const statHighlights = useMemo<StatHighlight[]>(() => {
    if (!current) {
      return []
    }

    const entries: Array<StatHighlight | null> = [
      current.score !== null
        ? {
            label: 'Score',
            value: current.score.toFixed(1),
            hint: 'MAL',
          }
        : null,
      current.rank !== null
        ? {
            label: 'Rank',
            value: `#${current.rank}`,
            hint: 'Global',
          }
        : null,
      current.episodes !== null
        ? {
            label: 'Episodes',
            value: `${current.episodes}`,
            hint: current.status ?? undefined,
          }
        : null,
    ]

    return entries.filter(Boolean) as StatHighlight[]
  }, [current])

  const genreChips = useMemo(() => current?.genres ?? [], [current])

  const metaRows = useMemo<Array<{ label: string; value: ReactNode }>>(() => {
    if (!current) {
      return []
    }

    const rows: Array<{ label: string; value: ReactNode }> = []

    if (current.season || current.year) {
      rows.push({
        label: 'Premiered',
        value: `${current.season ?? '—'} ${current.year ?? ''}`.trim(),
      })
    }

    if (current.duration) {
      rows.push({ label: 'Duration', value: current.duration })
    }

    if (current.rating) {
      rows.push({ label: 'Rating', value: current.rating })
    }

    if (current.studios?.length) {
      rows.push({
        label: current.studios.length > 1 ? 'Studios' : 'Studio',
        value: current.studios.map((studio) => studio.name).join(', '),
      })
    }

    if (current.aired?.string) {
      rows.push({ label: 'Aired', value: current.aired.string })
    }

    return rows
  }, [current])

  const episodeRows = useMemo(
    () => {
      if (!current) {
        return []
      }

      const seasonLabel =
        current.season || current.year
          ? `${current.season ?? ''} ${current.year ?? ''}`.trim()
          : null

      return [
        { label: 'Episodes', value: current.episodes !== null ? String(current.episodes) : 'Unknown' },
        { label: 'Duration', value: current.duration ?? 'Not specified' },
        { label: 'Broadcast', value: current.broadcast?.string ?? 'Not specified' },
        { label: 'Season', value: seasonLabel ?? 'Not specified' },
        { label: 'Status', value: current.status ?? 'Unknown' },
        { label: 'Source', value: current.source ?? 'Unknown' },
      ]
    },
    [current],
  )

  const studioRows = useMemo(
    () => {
      if (!current) {
        return []
      }

      const studios =
        current.studios?.map((studio) => studio.name).filter(Boolean).join(', ') || null
      const producers =
        current.producers?.map((producer) => producer.name).filter(Boolean).join(', ') || null
      const licensors =
        current.licensors?.map((licensor) => licensor.name).filter(Boolean).join(', ') || null

      return [
        {
          label: current.studios && current.studios.length > 1 ? 'Studios' : 'Studio',
          value: studios ?? 'Not listed',
        },
        { label: 'Producers', value: producers ?? 'Not listed' },
        { label: 'Licensors', value: licensors ?? 'Not listed' },
      ]
    },
    [current],
  )

  const renderSections = () => {
    if (!current) {
      return null
    }

    const sectionShell = {
      position: 'relative',
      borderRadius: 'var(--radius-card)',
      background: 'rgba(10, 14, 22, 0.9)',
      border: '1px solid rgba(226, 236, 255, 0.14)',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 24px 48px rgba(0, 0, 0, 0.32)',
      p: { xs: 1.8, md: 2.4 },
    } as const

    const synopsis = current.synopsis?.trim() || 'Synopsis not available.'
    const canExpandOverview = synopsis.length > 360

    return (
      <Stack spacing={{ xs: 2.8, md: 3.6 }} sx={{ mt: { xs: 5, md: 6 } }}>
        <Box sx={sectionShell}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#e8f5ff',
              fontSize: { xs: '1.05rem', md: '1.2rem' },
              mb: { xs: 1.1, md: 1.6 },
            }}
          >
            Overview
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(232, 245, 255, 0.82)',
              lineHeight: 1.6,
              fontSize: { xs: '0.95rem', md: '1rem' },
              ...(isOverviewExpanded || !canExpandOverview
                ? {}
                : {
                    display: '-webkit-box',
                    WebkitLineClamp: 6,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }),
            }}
          >
            {synopsis}
          </Typography>
          {canExpandOverview ? (
            <Button
              onClick={() => setIsOverviewExpanded((prev) => !prev)}
              size="small"
              sx={{
                mt: 1.2,
                alignSelf: 'flex-start',
                borderRadius: 'var(--radius-card)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                px: 1.6,
                py: 0.45,
                borderColor: 'rgba(0, 245, 255, 0.35)',
                color: '#e8f5ff',
              }}
              variant="outlined"
            >
              {isOverviewExpanded ? 'Show less' : 'Read more'}
            </Button>
          ) : null}
        </Box>

        {metaRows.length ? (
          <Box sx={sectionShell}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#e8f5ff',
                fontSize: { xs: '1.05rem', md: '1.2rem' },
                mb: { xs: 1.1, md: 1.6 },
              }}
            >
              Information
            </Typography>
            <Grid container spacing={{ xs: 2, md: 2.4 }}>
              {metaRows.map((row) => (
                <Grid key={row.label} item xs={12} sm={6}>
                  <Box
                    sx={{
                      ...infoCellBase,
                      border: '1px solid rgba(225, 236, 255, 0.16)',
                    }}
                  >
                    <Typography
                      variant="overline"
                      sx={{
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'rgba(232, 245, 255, 0.7)',
                        textAlign: { xs: 'left', sm: 'right' },
                      }}
                    >
                      {row.label}
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        color: '#e8f5ff',
                        fontWeight: 600,
                        lineHeight: 1.35,
                        fontSize: { xs: '0.95rem', md: '1rem' },
                        textAlign: 'left',
                      }}
                    >
                      {row.value}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : null}

        <Box sx={sectionShell}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#e8f5ff',
              fontSize: { xs: '1.05rem', md: '1.2rem' },
              mb: { xs: 1.1, md: 1.6 },
            }}
          >
            Episodes
          </Typography>
          <Grid container spacing={{ xs: 2, md: 2.4 }}>
            {episodeRows.map((row) => (
              <Grid key={row.label} item xs={12} sm={6}>
                <Box
                  sx={{
                    ...infoCellBase,
                    border: '1px solid rgba(0, 245, 255, 0.22)',
                  }}
                >
                  <Typography
                    variant="overline"
                    sx={{
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'rgba(232, 245, 255, 0.68)',
                      textAlign: { xs: 'left', sm: 'right' },
                    }}
                  >
                    {row.label}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: '#e8f5ff',
                      fontWeight: 600,
                      lineHeight: 1.35,
                      fontSize: { xs: '0.95rem', md: '1rem' },
                      textAlign: 'left',
                    }}
                  >
                    {row.value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box sx={sectionShell}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#e8f5ff',
              fontSize: { xs: '1.05rem', md: '1.2rem' },
              mb: { xs: 1.1, md: 1.6 },
            }}
          >
            Studio Details
          </Typography>
          <Stack spacing={1.2}>
            {studioRows.map((row) => (
              <Box
                key={row.label}
                sx={{
                  ...infoCellBase,
                  border: '1px solid rgba(226, 236, 255, 0.16)',
                }}
              >
                <Typography
                  variant="overline"
                  sx={{
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'rgba(232, 245, 255, 0.68)',
                    textAlign: { xs: 'left', sm: 'right' },
                  }}
                >
                  {row.label}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: '#e8f5ff',
                    fontWeight: 600,
                    lineHeight: 1.4,
                    fontSize: { xs: '0.95rem', md: '1rem' },
                    textAlign: 'left',
                  }}
                >
                  {row.value}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Stack>
    )
  }

  const renderLoading = () => (
    <Box
      sx={{
        borderRadius: { xs: 4, md: 6 },
        background: 'rgba(10, 14, 22, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(22px)',
        p: { xs: 3, md: 5 },
      }}
    >
      <Grid container spacing={{ xs: 4, md: 6 }}>
        <Grid item xs={12} md={5}>
          <Skeleton
            variant="rectangular"
            height={480}
            sx={{ borderRadius: { xs: 3, md: 4 } }}
          />
        </Grid>
        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            <Skeleton variant="text" height={48} />
            <Skeleton variant="text" height={24} width="45%" />
            <Skeleton variant="rectangular" height={120} />
            <Skeleton variant="text" height={24} width="60%" />
            <Skeleton variant="rectangular" height={160} />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )

  const renderHero = () => {
    if (loading && !current) {
      return renderLoading()
    }

    if (error) {
      return <Alert severity="error">{error}</Alert>
    }

    if (!current) {
      return (
        <Alert severity="info">
          Select an anime from the search results to view its details.
        </Alert>
      )
    }

    const image =
      current.images.jpg.large_image_url ||
      current.images.jpg.image_url ||
      current.images.jpg.small_image_url ||
      undefined

    return (
      <Box
        ref={heroRef}
        onPointerMove={handleHeroPointerMove}
        onPointerLeave={handleHeroPointerLeave}
        onBlur={handleHeroPointerLeave}
        sx={{
          position: 'relative',
          borderRadius: 'var(--radius-card)',
          overflow: 'hidden',
          background: 'rgba(10, 14, 22, 0.94)',
          border: '1px solid rgba(224, 236, 255, 0.14)',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(14px)',
          p: { xs: 2.2, md: 3 },
          isolation: 'isolate',
          mt: { xs: 2, md: 3 },
          '--parallax-x': 0,
          '--parallax-y': 0,
        }}
      >
        {image ? (
          <Box
            aria-hidden
            className="z-bg pe-none"
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(70px) saturate(1.1)',
              opacity: 0.28,
              transform: prefersReducedMotion
                ? 'scale(1.25)'
                : 'scale(1.25) translate3d(calc(var(--parallax-x) * 14px), calc(var(--parallax-y) * 14px), 0)',
              transition: prefersReducedMotion
                ? 'none'
                : 'transform 200ms ease-out',
            }}
          />
        ) : null}
        <Box
          aria-hidden
          className="z-bg pe-none"
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 18% 18%, rgba(0, 245, 255, 0.12), transparent 55%), radial-gradient(circle at 82% 28%, rgba(255, 74, 187, 0.12), transparent 65%)',
            opacity: 0.7,
          }}
        />
        <Box
          aria-hidden
          className="z-bg pe-none"
          sx={{
            position: 'absolute',
            inset: '5% 6%',
            borderRadius: 'inherit',
            background:
              'linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 70%)',
            opacity: 0.35,
            mixBlendMode: 'screen',
            animation: prefersReducedMotion ? 'none' : `${heroScan} 10s ease-in-out infinite`,
          }}
        />
        <Grid
          container
          spacing={{ xs: 2.6, md: 3.2 }}
          sx={{ position: 'relative', zIndex: 1, alignItems: 'start' }}
        >
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                position: 'relative',
                borderRadius: POSTER_TILE_RADIUS,
                overflow: 'hidden',
                background: 'rgba(6, 10, 16, 0.92)',
                border: '1px solid rgba(224, 236, 255, 0.16)',
                boxShadow: '0 18px 48px rgba(0, 0, 0, 0.4)',
                maxWidth: { xs: 'min(260px, 65%)', md: '100%' },
                mx: { xs: 'auto', md: 0 },
              }}
            >
              {image ? (
                <Box
                  component="img"
                  src={image}
                  alt={current.title}
                  loading="lazy"
                  sx={{
                    width: '100%',
                      aspectRatio: POSTER_TILE_ASPECT_RATIO,
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <Skeleton
                  variant="rectangular"
                  height={460}
                  sx={{ borderRadius: POSTER_TILE_RADIUS }}
                />
              )}
            </Box>
          </Grid>
          <Grid item xs={12} md={8}>
            <Stack spacing={{ xs: 2, md: 2.6 }}>
              <Stack spacing={1}>
                <Typography
                  variant="overline"
                  sx={{
                    letterSpacing: 2,
                    color: 'rgba(232, 245, 255, 0.68)',
                    textTransform: 'uppercase',
                  }}
                >
                  Featured Anime
                </Typography>
                <Typography
                  variant="h3"
                  component="h1"
                  sx={{
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: { xs: 0.3, md: 0.6 },
                    lineHeight: { xs: 1.1, md: 1.15 },
                    fontSize: {
                      xs: 'clamp(1.8rem, 5vw, 2.4rem)',
                      md: 'clamp(2rem, 3.4vw, 2.8rem)',
                    },
                    color: '#f5f8ff',
                  }}
                >
                  {current.title_english || current.title}
                </Typography>
                {current.title_japanese ? (
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: 'rgba(232, 245, 255, 0.68)',
                      fontSize: { xs: '0.95rem', md: '1rem' },
                    }}
                  >
                    {current.title_japanese}
                  </Typography>
                ) : null}
              </Stack>

              {statHighlights.length > 0 ? (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'repeat(auto-fit, minmax(136px, 1fr))',
                      lg: 'repeat(auto-fit, minmax(160px, 1fr))',
                    },
                    gap: { xs: 1.2, md: 1.6 },
                  }}
                >
                  {statHighlights.map((stat) => (
                    <Box
                      key={stat.label}
                      sx={{
                        borderRadius: 'var(--radius-card)',
                        border: '1px solid rgba(0, 245, 255, 0.2)',
                        background: 'rgba(12, 18, 30, 0.82)',
                        backdropFilter: 'blur(10px)',
                        px: { xs: 1.4, md: 1.6 },
                        py: { xs: 1.1, md: 1.3 },
                        display: 'grid',
                        rowGap: 0.35,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: 'rgba(232, 245, 255, 0.64)',
                        }}
                      >
                        {stat.label}
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        component="span"
                        sx={{
                          fontWeight: 600,
                          color: '#f1f6ff',
                          fontSize: { xs: '1.1rem', md: '1.2rem' },
                        }}
                      >
                        {stat.value}
                      </Typography>
                      {stat.hint ? (
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'rgba(232, 245, 255, 0.6)',
                            letterSpacing: '0.08em',
                            fontSize: '0.7rem',
                          }}
                        >
                          {stat.hint}
                        </Typography>
                      ) : null}
                    </Box>
                  ))}
                </Box>
              ) : null}

              {genreChips.length > 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 0.75,
                  }}
                >
                  {genreChips.map((genre) => (
                    <Box
                      key={genre.mal_id}
                      sx={{
                        borderRadius: 'var(--radius-card)',
                        border: '1px solid rgba(0, 245, 255, 0.22)',
                        background: 'rgba(6, 12, 20, 0.72)',
                        color: '#f1f6ff',
                        fontSize: '0.75rem',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        padding: '6px 12px',
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      {genre.name}
                    </Box>
                  ))}
                </Box>
              ) : null}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  variant="contained"
                  component="a"
                  href={current.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    color: '#061016',
                        borderRadius: 'var(--radius-card)',
                    px: { xs: 2.6, sm: 3.1 },
                    py: { xs: 0.9, sm: 1.05 },
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: '-20%',
                      borderRadius: 'inherit',
                      background:
                        'radial-gradient(circle at 50% 100%, rgba(0, 245, 255, 0.42), transparent 70%)',
                      opacity: 0,
                      transform: 'scale(0.8)',
                      transition: 'opacity 240ms ease, transform 240ms ease',
                    },
                    '&:hover::before': {
                      opacity: 1,
                      transform: 'scale(1)',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 'inherit',
                      background:
                        'linear-gradient(120deg, rgba(0, 245, 255, 0.24), rgba(255, 74, 187, 0.28))',
                      mixBlendMode: 'screen',
                      opacity: 0,
                      animation: prefersReducedMotion
                        ? 'none'
                        : `${buttonPlume} 3s ease-out infinite`,
                    },
                  }}
                >
                  Open on MyAnimeList
                </Button>
                {current.trailer?.url ? (
                  <Button
                    variant="outlined"
                    component="a"
                    href={current.trailer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                    borderRadius: 'var(--radius-card)',
                      borderColor: 'rgba(233, 244, 255, 0.22)',
                      color: '#e8f5ff',
                      px: { xs: 2.6, sm: 3.1 },
                      py: { xs: 0.9, sm: 1.05 },
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      '&:hover': {
                        borderColor: 'rgba(0, 245, 255, 0.45)',
                        color: '#061016',
                        background:
                          'linear-gradient(120deg, rgba(0, 245, 255, 0.16), rgba(255, 74, 187, 0.16))',
                      },
                    }}
                  >
                    Watch Trailer
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    )
  }

  return (
    <Box component="section" className="z-content" sx={{ py: { xs: 5, md: 7 } }}>
      <Box sx={pageContainerSx}>
        {renderHero()}
        {renderSections()}
      </Box>
    </Box>
  )
}

export default DetailPage

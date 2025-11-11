import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Box, Button, IconButton, Typography, useMediaQuery } from '@mui/material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import PosterTile, {
  POSTER_TILE_WIDTH,
  PosterTileSkeleton,
  type PosterTileData,
} from './PosterTile.tsx'

export interface PopularCarouselProps {
  items: PosterTileData[]
  loading?: boolean
  onSelect?: (anime: PosterTileData) => void
  emptyMessage?: string
  title?: string
  onSeeAll?: () => void
  seeAllLabel?: string
}

const PopularCarousel = ({
  items,
  loading = false,
  onSelect,
  emptyMessage = 'No titles available.',
  title,
  onSeeAll,
  seeAllLabel = 'See all',
}: PopularCarouselProps) => {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const updateScrollIndicators = useCallback(() => {
    const node = scrollRef.current
    if (!node) {
      setCanScrollPrev(false)
      setCanScrollNext(false)
      return
    }

    const { scrollLeft, scrollWidth, clientWidth } = node
    const maxScrollLeft = Math.max(scrollWidth - clientWidth - 4, 0)
    setCanScrollPrev(scrollLeft > 4)
    setCanScrollNext(scrollLeft < maxScrollLeft)
  }, [])

  useEffect(() => {
    updateScrollIndicators()
  }, [items.length, updateScrollIndicators])

  const handleScroll = useCallback(() => {
    updateScrollIndicators()
  }, [updateScrollIndicators])

  const handleArrowClick = useCallback(
    (direction: 'prev' | 'next') => {
      const node = scrollRef.current
      if (!node) {
        return
      }

      const delta =
        direction === 'prev' ? -node.clientWidth * 0.85 : node.clientWidth * 0.85
      node.scrollBy({
        left: delta,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      })

      if (prefersReducedMotion) {
        updateScrollIndicators()
      } else {
        window.setTimeout(updateScrollIndicators, 280)
      }
    },
    [prefersReducedMotion, updateScrollIndicators],
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2.4 } }}>
      {(title || onSeeAll) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          {title ? (
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              {title}
            </Typography>
          ) : (
            <span />
          )}
          {onSeeAll ? (
            <Button
              variant="text"
              size="small"
              onClick={onSeeAll}
              sx={{
                color: 'rgba(231, 245, 255, 0.78)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                borderRadius: 999,
                px: 1.5,
                '&:hover': {
                  background: 'rgba(0, 245, 255, 0.16)',
                  color: '#061016',
                },
              }}
            >
              {seeAllLabel}
            </Button>
          ) : null}
        </Box>
      )}
      <Box
        sx={{
          position: 'relative',
          borderRadius: 12,
          background: 'rgba(10, 14, 22, 0.75)',
          border: '1px solid rgba(0, 245, 255, 0.12)',
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(14px)',
          px: { xs: 1, md: 2 },
          py: { xs: 2, md: 2.4 },
          overflow: 'hidden',
        }}
      >
        <Box
          ref={scrollRef}
          onScroll={handleScroll}
          sx={{
            '--card-width': POSTER_TILE_WIDTH,
            display: 'grid',
            gridAutoFlow: 'column',
            gridAutoColumns: 'var(--card-width)',
            gap: { xs: 1.2, md: 1.6 },
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollBehavior: prefersReducedMotion ? 'auto' : 'smooth',
            paddingBlock: { xs: 0.25, md: 0.5 },
            paddingInline: { xs: 0.25, md: 0.5 },
            scrollPaddingInline: { xs: 0.25, md: 0.5 },
            alignItems: 'start',
            '&::-webkit-scrollbar': {
              height: 0,
            },
          }}
        >
          {loading
            ? Array.from({ length: 8 }).map((_, index) => (
                <Box
                  key={`carousel-skeleton-${index}`}
                  sx={{
                    scrollSnapAlign: 'center',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <PosterTileSkeleton size="sm" />
                </Box>
              ))
            : items.length > 0
            ? items.map((anime) => (
                <Box
                  key={anime.mal_id}
                  sx={{
                    scrollSnapAlign: 'center',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <PosterTile anime={anime} onSelect={onSelect} size="sm" elevation="hover" />
                </Box>
              ))
            : (
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(232, 245, 255, 0.7)', px: 2 }}
                >
                  {emptyMessage}
                </Typography>
              )}
        </Box>
        <IconButton
          aria-label="Scroll popular anime backward"
          onClick={() => handleArrowClick('prev')}
          disabled={!canScrollPrev}
          sx={{
            position: 'absolute',
            top: '50%',
            left: 8,
            transform: 'translateY(-50%)',
            display: { xs: 'none', md: 'flex' },
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'rgba(10, 14, 22, 0.78)',
            border: '1px solid rgba(231, 245, 255, 0.16)',
            color: 'rgba(231, 245, 255, 0.72)',
            opacity: canScrollPrev ? 0.95 : 0,
            pointerEvents: canScrollPrev ? 'auto' : 'none',
            transition: 'opacity 180ms ease, transform 180ms ease',
            '&:hover': {
              transform: 'translate(-2px, -50%)',
              background: 'rgba(0, 245, 255, 0.18)',
              color: '#061016',
            },
          }}
        >
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        <IconButton
          aria-label="Scroll popular anime forward"
          onClick={() => handleArrowClick('next')}
          disabled={!canScrollNext}
          sx={{
            position: 'absolute',
            top: '50%',
            right: 8,
            transform: 'translateY(-50%)',
            display: { xs: 'none', md: 'flex' },
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'rgba(10, 14, 22, 0.78)',
            border: '1px solid rgba(231, 245, 255, 0.16)',
            color: 'rgba(231, 245, 255, 0.72)',
            opacity: canScrollNext ? 0.95 : 0,
            pointerEvents: canScrollNext ? 'auto' : 'none',
            transition: 'opacity 180ms ease, transform 180ms ease',
            '&:hover': {
              transform: 'translate(2px, -50%)',
              background: 'rgba(255, 74, 187, 0.18)',
              color: '#061016',
            },
          }}
        >
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
        <Box
          aria-hidden
          className="z-bg pe-none"
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: 48,
            pointerEvents: 'none',
            background:
              'linear-gradient(90deg, rgba(11, 15, 22, 0.82), rgba(11, 15, 22, 0))',
          }}
        />
        <Box
          aria-hidden
          className="z-bg pe-none"
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            width: 48,
            pointerEvents: 'none',
            background:
              'linear-gradient(270deg, rgba(11, 15, 22, 0.82), rgba(11, 15, 22, 0))',
          }}
        />
      </Box>
    </Box>
  )
}

export default memo(PopularCarousel)


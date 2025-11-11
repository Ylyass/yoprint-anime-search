import { forwardRef } from 'react'
import { Box, Typography } from '@mui/material'
import type { MouseEventHandler, KeyboardEventHandler } from 'react'
import type { JikanAnimeListEntry } from '../types/jikan.ts'

export type PosterTileData = Pick<
  JikanAnimeListEntry,
  'mal_id' | 'title' | 'title_english' | 'title_japanese' | 'titles' | 'images' | 'url'
> & {
  title_synonyms?: string[]
}

export const POSTER_TILE_WIDTH = 'clamp(140px, 16vw, 210px)'
export const POSTER_TILE_ASPECT_RATIO = '3 / 4'
export const POSTER_TILE_RADIUS = 'var(--radius-card)'
export const POSTER_TILE_STRIP_RADIUS = 'calc(var(--radius-card) - 4px)'

export type PosterTileSize = 'sm' | 'md'
export interface PosterTileProps {
  anime: PosterTileData
  onSelect?: (anime: PosterTileData) => void
  size?: PosterTileSize
  maxTitleLines?: number
  elevation?: 'none' | 'hover'
  tabIndex?: number
  'aria-label'?: string
}

const IMAGE_RADIUS = POSTER_TILE_RADIUS
const STRIP_RADIUS = POSTER_TILE_STRIP_RADIUS

const sizeConfig: Record<
  PosterTileSize,
  {
    maxWidth: string
    stripPadding: string
    stripMinHeight: number
    hoverSurfaceShadow: string
    restingSurfaceShadow: string
  }
> = {
  sm: {
    maxWidth: POSTER_TILE_WIDTH,
    stripPadding: '10px 12px',
    stripMinHeight: 44,
    hoverSurfaceShadow: '0 16px 32px rgba(6, 12, 22, 0.42)',
    restingSurfaceShadow: '0 8px 18px rgba(6, 12, 22, 0.28)',
  },
  md: {
    maxWidth: POSTER_TILE_WIDTH,
    stripPadding: '12px 14px',
    stripMinHeight: 50,
    hoverSurfaceShadow: '0 18px 38px rgba(6, 12, 22, 0.45)',
    restingSurfaceShadow: '0 12px 26px rgba(6, 12, 22, 0.32)',
  },
}

const PosterTile = forwardRef<HTMLDivElement, PosterTileProps>(
  (
    {
      anime,
      onSelect,
      size = 'md',
      maxTitleLines = 2,
      elevation = 'hover',
      tabIndex,
      ...rest
    },
    ref,
  ) => {
    const title =
      anime.title_english ||
      anime.title ||
      anime.title_japanese ||
      anime.titles?.[0]?.title ||
      'Untitled'

    const image =
      anime.images?.jpg?.large_image_url ||
      anime.images?.jpg?.image_url ||
      anime.images?.jpg?.small_image_url ||
      ''

    const Component = onSelect ? 'button' : 'div'

    const handleClick: MouseEventHandler<HTMLDivElement> = (event) => {
      if (!onSelect) {
        return
      }
      event.preventDefault()
      onSelect(anime)
    }

    const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
      if (!onSelect) {
        return
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onSelect(anime)
      }
    }

    const config = sizeConfig[size]

    return (
      <Box
        ref={ref}
        component={Component}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={onSelect ? tabIndex ?? 0 : tabIndex}
        {...rest}
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: config.maxWidth,
          textAlign: 'left',
          border: 'none',
          background: 'transparent',
          padding: 0,
          cursor: onSelect ? 'pointer' : 'default',
          outline: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.75,
          transition:
            elevation === 'hover' ? 'transform 160ms ease, filter 160ms ease' : 'none',
          transform: 'translateZ(0)',
          filter: 'drop-shadow(0 6px 18px rgba(0, 0, 0, 0.45))',
          '&:hover':
            elevation === 'hover'
              ? {
                  transform: 'translateY(-4px)',
                  filter: 'drop-shadow(0 12px 26px rgba(0, 0, 0, 0.5))',
                }
              : undefined,
          '&:focus-visible > .poster-tile-surface': {
            boxShadow:
              '0 0 0 2px rgba(11, 15, 20, 0.94), 0 0 0 4px rgba(0, 245, 255, 0.55)',
          },
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
            '&:hover': elevation === 'hover' ? { transform: 'none', filter: 'none' } : undefined,
          },
        }}
      >
        <Box
          className="poster-tile-surface"
          sx={{
            borderRadius: IMAGE_RADIUS,
            overflow: 'hidden',
            position: 'relative',
            aspectRatio: '3 / 4',
            background: 'rgba(8, 14, 24, 0.78)',
            boxShadow:
              elevation === 'hover'
                ? config.hoverSurfaceShadow
                : config.restingSurfaceShadow,
          }}
        >
          <Box
            component="img"
            src={image}
            alt={title}
            loading="lazy"
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </Box>
        <Box
          sx={{
            borderRadius: STRIP_RADIUS,
            background: 'rgba(12, 18, 26, 0.72)',
            border: '1px solid rgba(0, 245, 255, 0.14)',
            backdropFilter: 'blur(12px)',
            padding: config.stripPadding,
            minHeight: config.stripMinHeight,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Typography
            component="span"
            variant="subtitle2"
            sx={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: maxTitleLines,
              overflow: 'hidden',
              fontWeight: 600,
              fontSize: '0.95rem',
              letterSpacing: 0.4,
              color: '#f1f6ff',
            }}
          >
            {title}
          </Typography>
        </Box>
      </Box>
    )
  },
)

PosterTile.displayName = 'PosterTile'

export default PosterTile

export const PosterTileSkeleton = ({
  size = 'md',
}: Pick<PosterTileProps, 'size'>) => {
  const config = sizeConfig[size]

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: config.maxWidth,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        filter: 'drop-shadow(0 6px 18px rgba(0, 0, 0, 0.35))',
      }}
    >
      <Box
        sx={{
          borderRadius: IMAGE_RADIUS,
          aspectRatio: '3 / 4',
          background:
            'linear-gradient(140deg, rgba(255,255,255,0.06), rgba(12, 18, 28, 0.4))',
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)',
            transform: 'translateX(-120%)',
            animation: 'posterTileSkeleton 1.4s ease-in-out infinite',
          },
        }}
      />
      <Box
        sx={{
          borderRadius: STRIP_RADIUS,
          background: 'rgba(12, 18, 26, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          height: config.stripMinHeight,
        }}
      />
      <style>
        {`@keyframes posterTileSkeleton {
        0% { transform: translateX(-120%); }
        100% { transform: translateX(120%); }
      }`}
      </style>
    </Box>
  )
}


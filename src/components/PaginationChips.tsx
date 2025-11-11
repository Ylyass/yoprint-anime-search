import { useMemo } from 'react'
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'

export interface PaginationChipsProps {
  count: number
  page: number
  onChange: (event: unknown, value: number) => void
}

type PageToken = number | 'ellipsis'

const buildTokens = (count: number, page: number): PageToken[] => {
  if (count <= 7) {
    return Array.from({ length: count }, (_, index) => index + 1)
  }

  const tokens: PageToken[] = []
  const clamp = (value: number) => Math.max(1, Math.min(count, value))
  const add = (value: number) => {
    if (!tokens.includes(value)) {
      tokens.push(value)
    }
  }

  add(1)

  const windowStart = clamp(page - 2)
  const windowEnd = clamp(page + 2)

  if (windowStart > 2) {
    tokens.push('ellipsis')
  }

  for (let current = windowStart; current <= windowEnd; current += 1) {
    add(current)
  }

  if (windowEnd < count - 1) {
    tokens.push('ellipsis')
  }

  add(count)

  return tokens
}

const PaginationChips = ({ count, page, onChange }: PaginationChipsProps) => {
  const theme = useTheme()
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const tokens = useMemo(() => buildTokens(count, page), [count, page])

  const handleClick = (targetPage: number) => {
    if (targetPage === page) {
      return
    }

    onChange(null, targetPage)
  }

  const handlePrev = () => {
    handleClick(Math.max(1, page - 1))
  }

  const handleNext = () => {
    handleClick(Math.min(count, page + 1))
  }

  const canGoPrev = page > 1
  const canGoNext = page < count

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 1.2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Tooltip title="Previous page">
          <span>
            <IconButton
              onClick={handlePrev}
              disabled={!canGoPrev}
              sx={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: 'rgba(12, 18, 26, 0.72)',
                border: '1px solid rgba(232, 245, 255, 0.16)',
                color: 'rgba(232, 245, 255, 0.7)',
                transition: 'all 200ms ease',
                boxShadow: canGoPrev ? '0 10px 26px rgba(0, 0, 0, 0.4)' : 'none',
                backdropFilter: 'blur(12px)',
                pointerEvents: canGoPrev ? 'auto' : 'none',
                '&:hover': {
                  background: 'rgba(0, 245, 255, 0.16)',
                  color: '#061016',
                  boxShadow: '0 18px 42px rgba(0, 245, 255, 0.24)',
                },
                '&:disabled': {
                  opacity: 0.4,
                },
              }}
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            width: '100%',
            maxWidth: 'min(100%, 820px)',
            overflowX: { xs: 'auto', md: 'visible' },
            padding: { xs: '4px 12px', md: 0 },
                borderRadius: 10,
            background: { xs: 'rgba(10, 16, 26, 0.55)', md: 'transparent' },
            scrollSnapType: { xs: 'x mandatory', md: 'none' },
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': {
              display: 'none',
            },
          }}
        >
          {tokens.map((token, index) =>
            token === 'ellipsis' ? (
              <Box
                key={`ellipsis-${index}`}
                sx={{
                  alignSelf: 'center',
                  color: 'rgba(232, 245, 255, 0.45)',
                  letterSpacing: 4,
                  fontWeight: 600,
                  px: 1,
                  textTransform: 'uppercase',
                  scrollSnapAlign: 'center',
                }}
              >
                …
              </Box>
            ) : (
              <Chip
                key={token}
                component="button"
                role="button"
                tabIndex={0}
                aria-current={token === page ? 'page' : undefined}
                label={token}
                onClick={() => handleClick(token)}
                sx={{
                  position: 'relative',
                  scrollSnapAlign: 'center',
                  borderRadius: 8,
                  px: 2.2,
                  py: 0.9,
                  minWidth: 52,
                  height: 40,
                  fontWeight: 600,
                  letterSpacing: 1,
                  fontSize: '0.88rem',
                  border: '1px solid rgba(232, 245, 255, 0.12)',
                  color:
                    token === page ? theme.palette.primary.main : '#e8f5ff',
                  background:
                    token === page
                      ? 'linear-gradient(135deg, rgba(0,245,255,0.18), rgba(12, 18, 28, 0.78))'
                      : 'rgba(12, 18, 28, 0.64)',
                  boxShadow: token === page ? '0 16px 38px rgba(0, 245, 255, 0.22)' : '0 12px 30px rgba(0, 0, 0, 0.35)',
                  textTransform: 'uppercase',
                  transition: prefersReducedMotion
                    ? 'none'
                    : 'transform 200ms ease, box-shadow 200ms ease, color 200ms ease, border-color 200ms ease',
                  transform: token === page ? 'translateY(-1px)' : 'none',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    border: token === page
                      ? '1px solid rgba(0, 245, 255, 0.6)'
                      : '1px solid transparent',
                    opacity: token === page ? 1 : 0,
                    transition: 'opacity 200ms ease',
                  },
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    borderColor: 'rgba(0, 245, 255, 0.35)',
                    boxShadow: '0 18px 46px rgba(0, 245, 255, 0.24)',
                    color: theme.palette.primary.main,
                  },
                  '&:focus-visible': {
                    outline: 'none',
                    boxShadow:
                      '0 0 0 2px rgba(11, 15, 20, 0.92), 0 0 0 4px rgba(0, 245, 255, 0.55)',
                  },
                }}
              />
            ),
          )}
        </Box>
        <Tooltip title="Next page">
          <span>
            <IconButton
              onClick={handleNext}
              disabled={!canGoNext}
              sx={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: 'rgba(12, 18, 26, 0.72)',
                border: '1px solid rgba(232, 245, 255, 0.16)',
                color: 'rgba(232, 245, 255, 0.7)',
                transition: 'all 200ms ease',
                boxShadow: canGoNext ? '0 10px 26px rgba(0, 0, 0, 0.4)' : 'none',
                backdropFilter: 'blur(12px)',
                pointerEvents: canGoNext ? 'auto' : 'none',
                '&:hover': {
                  background: 'rgba(255, 74, 187, 0.16)',
                  color: '#061016',
                  boxShadow: '0 18px 42px rgba(255, 74, 187, 0.22)',
                },
                '&:disabled': {
                  opacity: 0.4,
                },
              }}
            >
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  )
}

export default PaginationChips


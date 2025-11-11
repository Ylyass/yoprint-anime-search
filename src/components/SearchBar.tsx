import type { ChangeEvent } from 'react'
import { forwardRef } from 'react'
import { keyframes } from '@emotion/react'
import { Box, IconButton, InputAdornment, TextField } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'

export interface SearchBarProps {
  label?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onFocus?: (focused: boolean) => void
  onClear: () => void
  isLoading?: boolean
}

const pulse = keyframes`
  0% {
    opacity: 0.4;
    transform: scale(0.85);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0.4;
    transform: scale(0.85);
  }
`

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      label = 'Search anime',
      placeholder = 'Search for an anime...',
      value,
      onChange,
      onFocus,
      onClear,
      isLoading = false,
    },
    ref,
  ) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value)
    }

    const handleFocusIn = () => {
      onFocus?.(true)
    }

    const handleFocusOut = () => {
      onFocus?.(false)
    }

    const showClear = value.length > 0

    return (
      <TextField
        fullWidth
        type="search"
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={handleFocusIn}
        onBlur={handleFocusOut}
        inputProps={{ 'aria-label': label }}
        autoComplete="off"
        variant="outlined"
        inputRef={ref}
        InputLabelProps={{
          shrink: true,
          sx: {
            textTransform: 'uppercase',
            letterSpacing: 1.6,
            fontSize: '0.7rem',
            top: -8,
            color: 'rgba(232, 245, 255, 0.68)',
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ color: 'rgba(232,245,255,0.64)' }}>
              <SearchIcon aria-hidden />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end" sx={{ gap: 0.75 }}>
              {isLoading ? (
                <Box
                  component="span"
                  aria-hidden
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'rgba(0,245,255,0.82)',
                    animation: `${pulse} 1s ease-in-out infinite`,
                    boxShadow: '0 0 12px rgba(0, 245, 255, 0.38)',
                  }}
                />
              ) : null}
              {showClear ? (
                <IconButton
                  aria-label="Clear search"
                  edge="end"
                  onClick={onClear}
                  size="small"
                  sx={{ color: 'rgba(232,245,255,0.7)' }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              ) : null}
            </InputAdornment>
          ),
        }}
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', md: 440 },
          transition: 'max-width 220ms ease',
          '&.Mui-focused': {
            maxWidth: { xs: '100%', md: 480 },
          },
          '& .MuiFormLabel-root': {
            color: 'rgba(232, 245, 255, 0.68)',
          },
          '& .MuiInputBase-input': {
            caretColor: '#00f5ff',
            fontSize: { xs: '1rem', sm: '1.05rem' },
            fontWeight: 500,
            color: '#eef6ff',
            padding: '14px 0',
            height: '100%',
          },
          '& .MuiOutlinedInput-root': {
            position: 'relative',
            minHeight: 60,
            alignItems: 'center',
            borderRadius: 12,
            background: 'rgba(10, 14, 22, 0.9)',
            border: '1px solid rgba(233, 244, 255, 0.18)',
            paddingRight: 1.5,
            paddingLeft: 1.5,
            transition:
              'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease, background 200ms ease',
            '& fieldset': {
              border: 'none',
            },
            '&:hover': {
              borderColor: 'rgba(0, 245, 255, 0.32)',
              background: 'rgba(10, 14, 22, 0.94)',
            },
            '&.Mui-focused': {
              transform: 'translateY(-1px)',
              borderColor: 'rgba(0, 245, 255, 0.45)',
              background: 'rgba(10, 14, 22, 0.96)',
              boxShadow: '0 18px 48px rgba(0, 0, 0, 0.38)',
            },
          },
          '& .MuiOutlinedInput-root.Mui-disabled': {
            opacity: 0.6,
          },
          '@media (prefers-reduced-motion: reduce)': {
            '& .MuiOutlinedInput-root': {
              transition: 'none',
            },
            transition: 'none',
            '&.Mui-focused': {
              maxWidth: { xs: '100%', md: 440 },
            },
          },
        }}
      />
    )
  },
)

SearchBar.displayName = 'SearchBar'

export default SearchBar


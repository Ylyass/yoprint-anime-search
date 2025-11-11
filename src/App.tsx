import { useCallback, useEffect, useMemo, useState } from 'react'
import { keyframes } from '@emotion/react'
import {
  Link as RouterLink,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import SearchPage from './pages/SearchPage.tsx'
import DetailPage from './pages/DetailPage.tsx'
import { AppBar, Box, Container, Toolbar, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { CommandShelfContext } from './contexts/CommandShelfContext.tsx'
import { SearchExperienceContext } from './contexts/SearchExperienceContext.tsx'
import { useAppDispatch } from './app/hooks.ts'
import { clearSuggestions } from './features/search/searchSlice.ts'

const holoSheen = keyframes`
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
`

const scanline = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-40%);
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(60%);
  }
`

const glassFade = keyframes`
  0% {
    opacity: 0;
    filter: blur(18px);
    transform: translateY(12px);
  }
  60% {
    opacity: 1;
    filter: blur(4px);
    transform: translateY(0);
  }
  100% {
    opacity: 1;
    filter: blur(0px);
    transform: translateY(0);
  }
`

export default function App() {
  const location = useLocation()
  const dispatch = useAppDispatch()
  const [scanlineKey, setScanlineKey] = useState(0)
  const [shelfContent, setShelfContent] = useState<ReactNode | null>(null)
  const [searchActive, setSearchActive] = useState(false)

  const handleSetShelfContent = useCallback((content: ReactNode | null) => {
    setShelfContent(content)
  }, [])

  const commandShelfValue = useMemo(
    () => ({
      setShelfContent: handleSetShelfContent,
    }),
    [handleSetShelfContent],
  )

  const searchExperienceValue = useMemo(
    () => ({
      searchActive,
      setSearchActive,
    }),
    [searchActive],
  )

  useEffect(() => {
    setScanlineKey((key) => key + 1)
  }, [location.pathname])

  useEffect(() => {
    dispatch(clearSuggestions())
  }, [dispatch, location.pathname])

  return (
    <SearchExperienceContext.Provider value={searchExperienceValue}>
      <CommandShelfContext.Provider value={commandShelfValue}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          pb: 6,
          position: 'relative',
        }}
      >
        <Box
          component="header"
          className="z-header"
          sx={{
            position: 'sticky',
            top: { xs: 16, md: 28 },
            zIndex: (theme) => theme.zIndex.appBar + 1,
            display: { xs: searchActive ? 'none' : 'flex', md: 'flex' },
            justifyContent: 'center',
            px: { xs: 1.5, sm: 2, md: 3 },
            pt: { xs: 2, md: 4 },
            pointerEvents: 'none',
          }}
        >
          <AppBar
            position="static"
            elevation={0}
            sx={{
              opacity: { xs: 1, md: searchActive ? 0.82 : 1 },
              width: { xs: '100%', lg: 'clamp(320px, 70vw, 1080px)' },
              borderRadius: 10,
              px: { xs: 2, sm: 3, md: 3.5 },
              py: { xs: 1.2, md: 1.6 },
              background: 'rgba(8, 12, 20, 0.9)',
              border: '1px solid rgba(233, 244, 255, 0.12)',
              boxShadow: '0 24px 70px rgba(0, 0, 0, 0.45)',
              overflow: 'hidden',
              pointerEvents: 'auto',
            }}
          >
            <Toolbar
              sx={{
                minHeight: 'unset !important',
                width: '100%',
                position: 'relative',
                px: 0,
                py: 0,
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  alignItems: 'center',
                  width: '100%',
                  gap: { xs: 1.5, md: 2.5 },
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: '1fr auto 1fr',
                  },
                }}
              >
                <Box sx={{ display: { xs: 'none', md: 'block' } }} />
                <Typography
                  variant="h6"
                  component={RouterLink}
                  to="/"
                  sx={{
                    color: 'inherit',
                    textDecoration: 'none',
                    fontWeight: 600,
                    letterSpacing: 1.4,
                    textTransform: 'uppercase',
                    background:
                      'linear-gradient(90deg, #00f5ff 0%, #ff4abb 50%, #00f5ff 100%)',
                    backgroundSize: '200%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: `${holoSheen} 7s linear infinite`,
                    justifySelf: { xs: 'center', md: 'center' },
                    fontSize: { xs: '1.1rem', sm: '1.2rem' },
                  }}
                >
                  Anime Search
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: { xs: 'center', md: 'flex-end' },
                    width: '100%',
                    maxWidth: { xs: '100%', md: 420, lg: 460 },
                    justifySelf: { xs: 'center', md: 'end' },
                    transition: 'max-width 220ms ease',
                  }}
                >
                  {shelfContent}
                </Box>
              </Box>
            </Toolbar>
            <Box
              key={scanlineKey}
              sx={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                borderRadius: 'inherit',
                background:
                  'linear-gradient(180deg, transparent 0%, rgba(0, 245, 255, 0.48) 50%, transparent 100%)',
                opacity: 0,
                animation: `${scanline} 1.4s ease-out`,
              }}
            />
          </AppBar>
        </Box>

        <Container
          component="main"
          maxWidth="xl"
          className="z-content"
          sx={{
            flexGrow: 1,
            py: { xs: 5, sm: 7 },
          }}
        >
          <Box
            key={location.pathname}
            sx={{
              animation: `${glassFade} 620ms cubic-bezier(0.22, 0.68, 0.43, 0.98) both`,
            }}
          >
            <Routes>
              <Route path="/" element={<SearchPage />} />
              <Route path="/anime/:id" element={<DetailPage />} />
            </Routes>
          </Box>
        </Container>
      </Box>
      </CommandShelfContext.Provider>
    </SearchExperienceContext.Provider>
  )
}

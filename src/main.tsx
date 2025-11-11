import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { store } from './app/store'

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0b0f14',
      paper: 'rgba(255, 255, 255, 0.08)',
    },
    primary: {
      main: '#00f5ff',
      light: '#5bffe8',
      dark: '#00b0c2',
    },
    secondary: {
      main: '#ff4abb',
    },
    text: {
      primary: '#e8f5ff',
      secondary: 'rgba(232, 245, 255, 0.72)',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily:
      "'Space Grotesk','Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600, letterSpacing: 0.4 },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*, *::before, *::after': {
          borderColor: 'rgba(255, 255, 255, 0.08)',
        },
        body: {
          backgroundColor: '#0b0f14',
          color: '#e8f5ff',
        },
        '::selection': {
          backgroundColor: 'rgba(0, 245, 255, 0.45)',
          color: '#0b0f14',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background:
            'linear-gradient(145deg, rgba(18, 24, 36, 0.86), rgba(10, 14, 22, 0.72))',
          border: '1px solid rgba(232, 245, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          boxShadow:
            '0 32px 90px rgba(4, 12, 26, 0.65), 0 1px 0 rgba(255, 255, 255, 0.12) inset',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 1,
            borderRadius: 'inherit',
            padding: '1px',
            background:
              'linear-gradient(135deg, rgba(0, 245, 255, 0.55), rgba(255, 74, 187, 0.45))',
            mask:
              'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMask:
              'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            pointerEvents: 'none',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: '18% 24%',
            borderRadius: 'inherit',
            background:
              'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.18), transparent 70%)',
            filter: 'blur(30px)',
            opacity: 0.6,
            pointerEvents: 'none',
          },
        },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingInline: 18,
          paddingBlock: 10,
          backgroundColor: 'rgba(0, 245, 255, 0.14)',
          boxShadow: '0 10px 28px rgba(0, 0, 0, 0.25)',
          color: '#0b0f14',
          transition: 'transform 180ms ease, box-shadow 200ms ease, background 200ms ease',
          '&:hover': {
            boxShadow: '0 16px 36px rgba(0, 245, 255, 0.24)',
            transform: 'translateY(-2px)',
            backgroundColor: 'rgba(0, 245, 255, 0.2)',
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: '0 8px 22px rgba(0, 245, 255, 0.22)',
            backgroundColor: 'rgba(0, 245, 255, 0.18)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          background: 'rgba(15, 22, 32, 0.72)',
          border: '1px solid rgba(232, 245, 255, 0.14)',
          color: '#e8f5ff',
          paddingInline: 6,
          paddingBlock: 2,
          transition: 'transform 160ms ease, box-shadow 200ms ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 12px 26px rgba(0, 0, 0, 0.35)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background:
            'linear-gradient(145deg, rgba(10, 14, 22, 0.85), rgba(18, 24, 36, 0.72))',
          boxShadow: '0 30px 80px rgba(4, 12, 26, 0.55)',
          border: '1px solid rgba(232, 245, 255, 0.12)',
          backdropFilter: 'blur(28px)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          background:
            'linear-gradient(160deg, rgba(13, 18, 27, 0.78), rgba(9, 12, 18, 0.62))',
          border: '1px solid rgba(232, 245, 255, 0.1)',
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        },
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)

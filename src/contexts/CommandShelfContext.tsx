import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

export interface CommandShelfContextValue {
  setShelfContent: (content: ReactNode | null) => void
}

export const CommandShelfContext = createContext<CommandShelfContextValue | null>(
  null,
)

export const useCommandShelf = () => {
  const context = useContext(CommandShelfContext)
  if (!context) {
    throw new Error('useCommandShelf must be used within a CommandShelfContext provider')
  }

  return context
}


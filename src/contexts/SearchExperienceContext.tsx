import { createContext, useContext } from 'react'

interface SearchExperienceContextValue {
  searchActive: boolean
  setSearchActive?: (active: boolean) => void
}

const defaultValue: SearchExperienceContextValue = {
  searchActive: false,
}

export const SearchExperienceContext = createContext<SearchExperienceContextValue>(defaultValue)

export const useSearchExperience = () => useContext(SearchExperienceContext)


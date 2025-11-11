import { useNavigate } from 'react-router-dom'
import type { JikanAnimeListEntry } from '../types/jikan.ts'
import PosterTile from './PosterTile.tsx'

export interface AnimeCardProps {
  anime: JikanAnimeListEntry
}

const AnimeCard = ({ anime }: AnimeCardProps) => {
  const navigate = useNavigate()
  const handleSelect = () => {
    navigate(`/anime/${anime.mal_id}`)
  }

  return <PosterTile anime={anime} onSelect={handleSelect} />
}

export default AnimeCard


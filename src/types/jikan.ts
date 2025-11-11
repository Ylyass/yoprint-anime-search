export interface JikanPaginationItems {
  count: number
  total: number
  per_page: number
}

export interface JikanPagination {
  last_visible_page: number
  has_next_page: boolean
  current_page?: number
  items: JikanPaginationItems
}

export interface JikanImageVariant {
  image_url: string | null
  small_image_url: string | null
  medium_image_url?: string | null
  large_image_url: string | null
  maximum_image_url?: string | null
}

export interface JikanImages {
  jpg: Pick<JikanImageVariant, 'image_url' | 'small_image_url' | 'large_image_url'>
  webp?: Pick<JikanImageVariant, 'image_url' | 'small_image_url' | 'large_image_url'>
}

export interface JikanTrailerImages {
  image_url: string | null
  small_image_url: string | null
  medium_image_url: string | null
  large_image_url: string | null
  maximum_image_url: string | null
}

export interface JikanTrailer {
  youtube_id: string | null
  url: string | null
  embed_url: string | null
  images: JikanTrailerImages | null
}

export interface JikanTitle {
  type: string
  title: string
}

export interface JikanNamedResource {
  mal_id: number
  type: string
  name: string
  url: string
}

export interface JikanGenre extends JikanNamedResource {}

export interface JikanAiredDate {
  day: number | null
  month: number | null
  year: number | null
}

export interface JikanAired {
  from: string | null
  to: string | null
  prop: {
    from: JikanAiredDate
    to: JikanAiredDate
  }
  string: string | null
}

export interface JikanBroadcast {
  day: string | null
  time: string | null
  timezone: string | null
  string: string | null
}

export interface JikanAnimeCore {
  mal_id: number
  url: string
  images: JikanImages
  title: string
  titles?: JikanTitle[]
  title_english: string | null
  title_japanese: string | null
  title_synonyms: string[]
  synopsis: string | null
  type: string | null
  episodes: number | null
  status: string | null
  rating: string | null
  duration: string | null
  score: number | null
  scored_by?: number | null
  season?: string | null
  year: number | null
}

export interface JikanAnimeListEntry extends JikanAnimeCore {
  background?: string | null
  genres: JikanGenre[]
  explicit_genres?: JikanGenre[]
  themes?: JikanGenre[]
  demographics?: JikanGenre[]
  trailer: JikanTrailer | null
}

export interface JikanAnimeSearchResponse {
  pagination: JikanPagination
  data: JikanAnimeListEntry[]
}

export interface JikanRelation {
  relation: string
  entry: JikanNamedResource[]
}

export interface JikanAnimeDetail extends JikanAnimeListEntry {
  aired: JikanAired
  broadcast: JikanBroadcast
  producers: JikanNamedResource[]
  licensors: JikanNamedResource[]
  studios: JikanNamedResource[]
  source: string | null
  popularity: number | null
  members: number | null
  favorites: number | null
  trailer: JikanTrailer | null
  relations: JikanRelation[]
  rating: string | null
  status: string | null
  duration: string | null
}


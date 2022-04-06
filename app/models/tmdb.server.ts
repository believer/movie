export type TMDbMovie = {
  title: string
  id: string
  poster_path: string | null
}

export const tmdbSearch = async (query: string) => {
  const tmdbBaseUrl = 'https://api.themoviedb.org/3/search/movie'
  const tmdbKey = process.env.TMDB_API_KEY
  const response = await fetch(
    `${tmdbBaseUrl}?api_key=${tmdbKey}&query=${query}`
  )
  return response.json()
}

export const tmdbFetchMovie = async (route: string) => {
  const tmdbBaseUrl = 'https://api.themoviedb.org/3/movie'
  const tmdbKey = process.env.TMDB_API_KEY
  const response = await fetch(`${tmdbBaseUrl}${route}?api_key=${tmdbKey}`)
  return response.json()
}

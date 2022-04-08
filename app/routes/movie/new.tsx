import React from 'react'
import {
  ActionFunction,
  Form,
  json,
  redirect,
  useActionData,
  useTransition,
} from 'remix'
import { Input } from '~/components/form'
import { tmdbFetchMovie, TMDbMovie, tmdbSearch } from '~/models/tmdb.server'
import { getCastAndCrew, imdbId } from '~/utils/addMovie.server'
import { db } from '~/utils/db.server'
import { requireUserId } from '~/utils/session.server'

type SearchResults = { type: 'search'; results: Array<TMDbMovie> }

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request)
  const form = await request.formData()
  const _action = form.get('_action')

  if (_action === 'search') {
    const query = form.get('query')

    if (!query) {
      return json('Query is required', { status: 400 })
    }

    const {
      results,
    }: {
      results: Array<TMDbMovie>
    } = await tmdbSearch(query.toString())

    return json<SearchResults>({ type: 'search', results })
  }

  if (_action === 'add') {
    const id = imdbId(form.get('movieId'))
    const rating = Number(form.get('rating'))
    const date = form.get('date')
      ? new Date(form.get('date') as string).toISOString()
      : new Date().toISOString()
    const movie = await tmdbFetchMovie(`/${id}`)
    const credits = await tmdbFetchMovie(`/${id}/credits`)
    const persons = getCastAndCrew(credits.cast, credits.crew)

    const movieExists = await db.movie.findUnique({
      where: { imdb_id: movie.imdb_id },
    })

    // If movie has already been added, add a new watch
    // and rating
    if (movieExists) {
      await db.seen.create({
        data: {
          user_id: userId,
          movie_id: movieExists.id,
          date,
        },
      })

      await db.rating.create({
        data: {
          rating,
          user_id: userId,
          movie_id: movieExists.id,
        },
      })

      return redirect(`/movie/${movieExists.id}`)
    }

    // Create new movie if it doesn't exist
    const fields = {
      data: {
        imdb_id: movie.imdb_id,
        overview: movie.overview,
        runtime: movie.runtime,
        poster: movie.poster_path,
        release_date: new Date(movie.release_date),
        tagline: movie.tagline,
        title: movie.title,
        rating: {
          create: [{ rating, user_id: userId }],
        },
        seen: {
          create: [{ date, user_id: userId }],
        },
        movie_genre: {
          create: movie.genres.map(({ name }: { name: string }) => ({
            genre: { connectOrCreate: { create: { name }, where: { name } } },
          })),
        },
        movie_person: {
          create: persons,
        },
      },
    }

    const newMovie = await db.movie.create(fields)

    return redirect(`/movie/${newMovie.id}`)
  }
}

export default function AddMoviePage() {
  const transition = useTransition()
  const actionData = useActionData<SearchResults>()
  const [searchResults, setSearchResults] = React.useState<Array<TMDbMovie>>([])
  const [movieId, setMovieId] = React.useState('')
  const formRef = React.useRef<HTMLFormElement>(null)
  const isSearching =
    transition.state === 'submitting' &&
    transition.submission.formData.get('_action') === 'search'

  React.useEffect(() => {
    if (actionData && actionData.type === 'search') {
      setSearchResults(actionData.results)
    }
  }, [actionData])

  React.useEffect(() => {
    if (!isSearching) {
      formRef.current?.reset()
    }
  }, [isSearching])

  return (
    <div className="max-w-2xl md:mx-auto my-8 mx-5 grid grid-cols-1 sm:grid-cols-2 gap-8">
      <Form method="post">
        <div className="mb-4">
          <Input
            defaultValue={movieId}
            label="IMDb ID / TMDb ID"
            name="movieId"
          />
        </div>
        <div className="mb-4">
          <Input type="number" label="Rating" name="rating" max="10" min="0" />
        </div>
        <div className="mb-4">
          <Input type="datetime-local" label="Date" name="date" />
        </div>
        <button
          name="_action"
          value="add"
          type="submit"
          className="w-full bg-brandBlue-500 text-sm p-2 rounded text-white"
        >
          {transition.submission && transition.submission.formData.get('imdb')
            ? 'Adding movie...'
            : 'Add movie'}
        </button>
      </Form>
      <div>
        <Form method="post" ref={formRef}>
          <div className="mb-4">
            <Input label="Search for a movie" name="query" />
          </div>
          <button
            name="_action"
            value="search"
            type="submit"
            className="w-full bg-brandBlue-500 text-sm p-2 rounded text-white"
          >
            {transition.submission &&
            transition.submission.formData.get('query')
              ? 'Search for movie...'
              : 'Search'}
          </button>
        </Form>
        {searchResults && (
          <ul className="mt-4 space-y-2">
            {searchResults.map((movie) => (
              <li key={movie.id}>
                <button
                  className="text-left text-sm underline text-brandBlue-600"
                  onClick={() => {
                    setMovieId(movie.id)
                    setSearchResults([])
                  }}
                >
                  {movie.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

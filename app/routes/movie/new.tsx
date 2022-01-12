import { ActionFunction, redirect } from 'remix'
import { getCastAndCrew, imdbId } from '~/utils/addMovie.server'
import { db } from '~/utils/db.server'
import { requireUserId } from '~/utils/session.server'

const tmdbFetch = async (route: string) => {
  const tmdbBaseUrl = 'https://api.themoviedb.org/3/movie'
  const tmdbKey = process.env.TMDB_API_KEY
  const response = await fetch(`${tmdbBaseUrl}${route}?api_key=${tmdbKey}`)
  const data = await response.json()

  return data
}

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request)
  const form = await request.formData()

  const id = imdbId(form.get('imdb'))
  const rating = Number(form.get('rating'))
  const date = form.get('date')
    ? new Date(form.get('date') as string).toISOString()
    : new Date().toISOString()

  const movie = await tmdbFetch(`/${id}`)
  const credits = await tmdbFetch(`/${id}/credits`)
  const persons = getCastAndCrew(credits.cast, credits.crew)

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

export default function AddMoviePage() {
  return (
    <div className="max-w-sm md:mx-auto my-10 mx-5">
      <form method="post">
        <div className="mb-4">
          <label>
            <span className="block text-sm font-semibold mb-2">IMDb Id</span>
            <input
              className="border border-gray-700 w-full px-2 py-1 rounded-sm"
              type="text"
              name="imdb"
            />
          </label>
        </div>
        <div className="mb-4">
          <label>
            <span className="block text-sm font-semibold mb-2">Rating</span>
            <input
              className="w-full border border-gray-700 px-2 py-1"
              min="0"
              max="10"
              type="number"
              name="rating"
            />
          </label>
        </div>
        <div className="mb-4">
          <label>
            <span className="block text-sm font-semibold mb-2">Date</span>
            <input
              className="border border-gray-700 w-full px-2 py-1"
              type="datetime-local"
              name="date"
            />
          </label>
        </div>
        <div>
          <button
            type="submit"
            className="w-full bg-blue-600 py-2 px-2 rounded text-white"
          >
            Add movie
          </button>
        </div>
      </form>
    </div>
  )
}

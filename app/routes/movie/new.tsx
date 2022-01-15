import { ActionFunction, redirect } from 'remix'
import { Input } from '~/components/form'
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
    <>
      <div className="max-w-sm md:mx-auto my-8 mx-5">
        <form method="post">
          <div className="mb-4">
            <Input label="IMDb ID" name="imdb" />
          </div>
          <div className="mb-4">
            <Input
              type="number"
              label="Rating"
              name="rating"
              max="10"
              min="0"
            />
          </div>
          <div className="mb-4">
            <Input type="datetime-local" label="Date" name="date" />
          </div>
          <div>
            <button
              type="submit"
              className="w-full bg-brandBlue-500 text-sm p-2 rounded text-white"
            >
              Add movie
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

import { job } from '@prisma/client'
import { ActionFunction, redirect } from 'remix'
import { db } from '~/utils/db.server'

const validDepartments = ['Writing', 'Sound', 'Production', 'Directing']
const jobs: Record<string, job> = {
  Screenplay: 'writer',
  Writer: 'writer',
  'Original Music Composer': 'composer',
  Producer: 'producer',
  'Associate Producer': 'producer',
  'Executive Producer': 'producer',
  Director: 'director',
}

const getCastAndCrew = (
  cast: Array<{ name: string; id: number }>,
  crew: Array<{ name: string; id: number; job: job; department: string }>
) => {
  const persons = new Map()

  for (const credit of cast) {
    persons.set(credit.id + '-cast', {
      job: 'cast' as job,
      person: {
        connectOrCreate: {
          create: { name: credit.name, original_id: credit.id },
          where: { original_id: credit.id },
        },
      },
    })
  }

  for (const credit of crew) {
    if (
      Object.keys(jobs).includes(credit.job) &&
      validDepartments.includes(credit.department)
    ) {
      persons.set(credit.id + '-' + jobs[credit.job], {
        job: jobs[credit.job],
        person: {
          connectOrCreate: {
            create: { name: credit.name, original_id: credit.id },
            where: { original_id: credit.id },
          },
        },
      })
    }
  }

  return Array.from(persons.values())
}

export const action: ActionFunction = async ({ request }) => {
  const tmdbBaseUrl = 'https://api.themoviedb.org/3/movie'
  const form = await request.formData()

  const imdbIdInput = form.get('imdb')
  const imdbId = imdbIdInput?.toString().match(/tt\d+/)?.[0]
  const rating = Number(form.get('rating'))
  const date = form.get('date')
    ? new Date(form.get('date') as string).toISOString()
    : new Date().toISOString()

  const movieResponse = await fetch(
    `${tmdbBaseUrl}/${imdbId}?api_key=${process.env.TMDB_API_KEY}`
  )
  const movie = await movieResponse.json()

  const creditsResponse = await fetch(
    `${tmdbBaseUrl}/${imdbId}/credits?api_key=${process.env.TMDB_API_KEY}`
  )
  const credits = await creditsResponse.json()
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
        create: [{ rating }],
      },
      seen: {
        create: [{ date }],
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

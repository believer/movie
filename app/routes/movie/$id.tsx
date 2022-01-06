import { genre, job, movie, person, seen } from '@prisma/client'
import { Link, LoaderFunction, useLoaderData } from 'remix'
import { db } from '~/utils/db.server'

const dateFormatter = new Intl.DateTimeFormat('sv-SE')

type LoaderData = {
  movie: movie & {
    movie_person: Array<{ person: person; job: job }>
    movie_genre: Array<{ genre: genre }>
    seen: Array<Pick<seen, 'date'>>
  }
}

export let loader: LoaderFunction = async ({ params }) => {
  const movie = await db.movie.findUnique({
    where: { id: Number(params.id) },
    include: {
      rating: true,
      seen: { select: { date: true } },
      movie_genre: { select: { genre: true } },
      movie_person: {
        select: { job: true, person: true },
        orderBy: { id: 'desc' },
      },
    },
  })

  if (!movie) {
    throw new Error('No movie found')
  }

  return { movie }
}

export default function MoviePage() {
  const { movie } = useLoaderData<LoaderData>()

  const cast = movie.movie_person.filter(({ job }) => job === 'cast')
  const crew = movie.movie_person.filter(({ job }) => job !== 'cast')

  return (
    <div>
      <Link to="/">Back</Link>
      <div className="grid md:grid-movie gap-5 mt-8">
        <div className="col-start-3 col-end-3">
          <h1 className="text-4xl font-bold">{movie.title}</h1>
          <div className="mt-2 mb-4 flex text-sm text-gray-600">
            {movie.movie_genre.map(({ genre }) => genre.name).join(', ')}
          </div>
          <p>{movie.overview}</p>
          <h2 className="text-lg font-semibold mt-4 mb-2">Seen</h2>
          <ul className="mb-4 text-sm text-gray-600">
            {movie.seen
              .map(({ date }) => dateFormatter.format(new Date(date)))
              .map((date) => (
                <li key={date}>{date}</li>
              ))}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">Cast</h2>
          <ul className="grid grid-cols-3 gap-y-1">
            {cast.map(({ person }) => (
              <li key={person.id}>
                <Link
                  className="text-blue-700 underline text-sm"
                  to={`/person/${person.id}`}
                  prefetch="intent"
                >
                  {person.name}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="text-lg font-semibold my-4">Crew</h2>
          <ul className="grid grid-cols-3 gap-y-1">
            {crew.map(({ job, person }) => (
              <li key={person.id} className="flex items-center space-x-2">
                <Link
                  className="text-blue-700 underline text-sm"
                  to={`/person/${person.id}`}
                  prefetch="intent"
                >
                  {person.name}
                </Link>
                <span className="text-xs text-gray-500">{job}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

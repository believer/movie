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
    <div className="mx-auto max-w-4xl my-10">
      <Link to="/">Back</Link>
      <h1 className="text-4xl font-bold my-8">{movie.title}</h1>
      <p>{movie.overview}</p>
      <ul className="mt-4">
        {movie.seen
          .map(({ date }) => dateFormatter.format(new Date(date)))
          .map((date) => {
            return <li key={date}>{date}</li>
          })}
      </ul>
      <ul className="mt-4">
        {movie.movie_genre.map(({ genre }) => {
          return <li key={genre.id}>{genre.name}</li>
        })}
      </ul>
      <ul className="mt-4 grid grid-cols-3 gap-y-1">
        {cast.map(({ person }) => {
          return (
            <li key={person.id}>
              <Link
                className="text-blue-700 underline"
                to={`/person/${person.id}`}
              >
                {person.name}
              </Link>
            </li>
          )
        })}
      </ul>
      <ul className="mt-4 grid grid-cols-3 gap-y-1">
        {crew.map(({ job, person }) => {
          return (
            <li key={person.id} className="flex items-center space-x-2">
              <Link
                className="text-blue-700 underline"
                to={`/person/${person.id}`}
              >
                {person.name}
              </Link>
              <span className="text-xs text-gray-500">{job}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

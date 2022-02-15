import { job, movie } from '@prisma/client'
import { Link, LoaderFunction, useLoaderData } from 'remix'
import { H1, H2 } from '~/components/typography'
import { yearFromDate } from '~/utils/date'
import { db } from '~/utils/db.server'

type LoaderData = {
  name: string
  cast: Array<{ movie: movie; job: job }>
  crew: Array<{ movie: movie; job: job }>
}

export let loader: LoaderFunction = async ({ params }) => {
  const person = await db.person.findUnique({
    where: { id: Number(params.id) },
    include: {
      movie_person: {
        select: { job: true, movie: true },
        orderBy: {
          movie: {
            release_date: 'desc',
          },
        },
      },
    },
  })

  if (!person) {
    throw new Error('No person found')
  }

  const cast = person.movie_person.filter(({ job }) => job === 'cast')
  const crew = person.movie_person.filter(({ job }) => job !== 'cast')

  return { name: person.name, cast, crew }
}

export default function MoviePage() {
  const { name, cast, crew } = useLoaderData<LoaderData>()

  return (
    <div className="my-8 mx-5">
      <div className="max-w-4xl lg:mx-auto mb-10 mx-5 space-y-4">
        <H1>{name}</H1>
        {cast.length > 0 && (
          <>
            <H2>Cast</H2>
            <ul className="grid grid-cols-1 lg:grid-cols-2 gap-1">
              {cast.map(({ movie }) => (
                <li className="space-x-2" key={movie.id}>
                  <Link
                    className="text-brandBlue-600 underline text-sm"
                    to={`/movie/${movie.id}`}
                    prefetch="intent"
                  >
                    {movie.title}
                  </Link>
                  <span className="text-xs text-gray-500">
                    ({movie.release_date && yearFromDate(movie.release_date)})
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
        {crew.length > 0 && (
          <>
            <H2>Crew</H2>
            <ul className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-1">
              {crew.map(({ job, movie }) => (
                <li key={movie.id} className="flex items-center space-x-2">
                  <Link
                    className="text-brandBlue-600 underline text-sm"
                    to={`/movie/${movie.id}`}
                    prefetch="intent"
                  >
                    {movie.title}
                  </Link>
                  <span className="text-xs text-gray-500">
                    ({movie.release_date && yearFromDate(movie.release_date)})
                  </span>
                  <span className="text-xs text-gray-500">{job}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

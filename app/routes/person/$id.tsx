import { job, movie } from '@prisma/client'
import { Link, LoaderFunction, useLoaderData } from 'remix'
import { H1, H2 } from '~/components/typography'
import { yearFromDate } from '~/utils/date'
import { db } from '~/utils/db.server'

type Crew = Record<job, Array<{ movie: movie; job: job }>>

type LoaderData = {
  name: string
  cast: Array<{ movie: movie; job: job }>
  crew: Crew
  hasCrew: boolean
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
  const filteredCrew = person.movie_person.filter(({ job }) => job !== 'cast')

  let crew: Crew = {
    director: [],
    writer: [],
    producer: [],
    composer: [],
    cast: [],
  }

  for (const c of filteredCrew) {
    crew[c.job].push(c)
  }

  return { name: person.name, cast, crew, hasCrew: filteredCrew.length > 0 }
}

export default function MoviePage() {
  const { name, cast, crew, hasCrew } = useLoaderData<LoaderData>()

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
        {hasCrew
          ? Object.keys(crew).map((job) => {
              if (crew[job as job].length === 0) {
                return null
              }

              return (
                <>
                  <H2>
                    {job.substring(0, 1).toUpperCase() + job.substring(1)}
                  </H2>
                  <ul className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-1">
                    {crew[job as job].map(({ job, movie }) => (
                      <li key={movie.id} className="space-x-2">
                        <Link
                          className="text-brandBlue-600 underline text-sm"
                          to={`/movie/${movie.id}`}
                          prefetch="intent"
                        >
                          {movie.title}
                        </Link>
                        <span className="text-xs text-gray-500">
                          (
                          {movie.release_date &&
                            yearFromDate(movie.release_date)}
                          )
                        </span>
                        <span className="text-xs text-gray-500">{job}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )
            })
          : null}
      </div>
    </div>
  )
}

import { movie, user } from '@prisma/client'
import { CartesianGrid } from 'recharts'
import { XAxis, YAxis } from 'recharts'
import { Tooltip } from 'recharts'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer } from 'recharts'
import { Link, LoaderFunction, Outlet, useLoaderData } from 'remix'
import Navigation from '~/components/navigation'
import { db } from '~/utils/db.server'
import { getUser } from '~/utils/session.server'

type Runtime = {
  days: number
  hours: number
  minutes: number
  totalRuntimeInMinutes: number
}

type YearCount = {
  count: number
  year: number
}

type Rating = {
  count: number
  rating: number
}

type Genres = {
  count: number
  name: string
}

type Person = {
  name: string
  id: number
  count: number
}

type Persons = {
  cast: Array<Person>
  directors: Array<Person>
  writers: Array<Person>
  producers: Array<Person>
  composers: Array<Person>
}

type Stats = {
  totalUniqueMovies: number
  totalNumberOfMoviesWithRewatches: number
  runtime: Runtime
  genres: Array<Genres>
  moviesFromYear: Array<YearCount>
  seenInYear: Array<YearCount>
  ratings: Array<Rating>
  persons: Persons
  rewatchedMovies: Array<Pick<movie, 'id' | 'title'> & { count: number }>
}

type LoaderData = {
  user: user | null
  stats: Stats
}

export let loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request)
  const user_id = Number(user?.id)
  const totalUniqueMovies = await db.seen.findMany({
    distinct: 'movie_id',
    where: { user_id },
  })

  const totalNumberOfMoviesWithRewatches = await db.seen.count({
    where: { user_id },
  })

  const moviesFromYear =
    await db.$queryRaw`SELECT COUNT(*), date_part('year', release_date) as year FROM movie GROUP BY date_part('year', release_date) ORDER BY year ASC;`

  const seenInYear =
    await db.$queryRaw`SELECT COUNT(*), date_part('year', date) as year FROM seen WHERE user_id=${user_id} GROUP BY date_part('year', date) ORDER BY year ASC;`

  const ratings =
    await db.$queryRaw`SELECT COUNT(*), rating FROM rating WHERE user_id=${user_id} GROUP BY rating ORDER BY rating ASC;`

  const genres =
    await db.$queryRaw`SELECT COUNT(*), g.name FROM movie_genre AS mg INNER JOIN genre AS g ON mg.genre_id = g.id GROUP BY g.name ORDER BY name ASC;`

  const cast = await db.$queryRaw`SELECT COUNT(*), p.name, p.id
      FROM movie_person AS mp
      INNER JOIN person AS p ON mp.person_id = p.id
      WHERE job = 'cast'
      GROUP BY p.name, p.id
      ORDER BY count DESC, p.name ASC
      LIMIT 20;`

  const directors =
    await db.$queryRaw`SELECT COUNT(*), p.name, p.id FROM movie_person AS mp INNER JOIN person AS p ON mp.person_id = p.id WHERE job = 'director' GROUP BY p.name, p.id ORDER BY count DESC, p.name ASC LIMIT 20;`
  const composers =
    await db.$queryRaw`SELECT COUNT(*), p.name, p.id FROM movie_person AS mp INNER JOIN person AS p ON mp.person_id = p.id WHERE job = 'composer' GROUP BY p.name, p.id ORDER BY count DESC, p.name ASC LIMIT 20;`
  const writers =
    await db.$queryRaw`SELECT COUNT(*), p.name, p.id FROM movie_person AS mp INNER JOIN person AS p ON mp.person_id = p.id WHERE job = 'writer' GROUP BY p.name, p.id ORDER BY count DESC, p.name ASC LIMIT 20;`
  const producers =
    await db.$queryRaw`SELECT COUNT(*), p.name, p.id FROM movie_person AS mp INNER JOIN person AS p ON mp.person_id = p.id WHERE job = 'producer' GROUP BY p.name, p.id ORDER BY count DESC, p.name ASC LIMIT 20;`

  const rewatchedMovies = await db.$queryRaw`SELECT COUNT(*), m.id, m.title
      FROM seen AS s
      INNER JOIN movie AS m ON s.movie_id = m.id
      WHERE s.user_id=${user_id}
      GROUP BY m.id
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 21;`

  const allRuntimes = await db.seen.findMany({
    select: { movie: { select: { runtime: true } } },
    where: { user_id },
  })

  const totalRuntimeInMinutes = allRuntimes.reduce(
    (acc, { movie: { runtime } }) => acc + runtime,
    0
  )

  const days = totalRuntimeInMinutes / (24 * 60)
  const hours = (days % 1) * 24
  const minutes = (hours % 1) * 60

  return {
    user,
    stats: {
      totalUniqueMovies: totalUniqueMovies.length,
      totalNumberOfMoviesWithRewatches,
      runtime: {
        minutes: Math.floor(minutes),
        hours: Math.floor(hours),
        days: Math.floor(days),
        totalRuntimeInMinutes,
      },
      genres,
      seenInYear,
      moviesFromYear,
      ratings,
      persons: { cast, writers, directors, producers, composers },
      rewatchedMovies,
    },
  } as LoaderData
}

const People = ({
  people,
  title,
}: {
  people: Array<Person>
  title: string
}) => {
  return (
    <div>
      <h2 className="mb-2 text-lg font-bold">{title}</h2>
      <ul className="text-sm space-y-2">
        {people.map(({ name, id, count }) => (
          <li key={id}>
            <Link
              className="text-brandBlue-600 underline text-sm"
              to={`/person/${id}`}
              prefetch="intent"
            >
              {name} <span className="text-xs text-gray-500">({count})</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Stats() {
  const { user, stats } = useLoaderData<LoaderData>()

  return (
    <>
      <Navigation username={user?.username} />
      <div className="max-w-4xl mx-auto grid grid-cols-1 gap-5 mb-10">
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
          <div className="text-center font-bold text-2xl">
            {stats.totalUniqueMovies}
            <div className="text-gray-600 text-sm font-normal">
              unique movies
            </div>
          </div>
          <div className="text-center font-bold text-2xl">
            {stats.totalNumberOfMoviesWithRewatches}
            <div className="text-gray-600 text-sm font-normal">
              movies including rewatches
            </div>
          </div>
        </div>
        <div className="text-center font-bold text-2xl">
          {stats.runtime.totalRuntimeInMinutes} minutes
          <div className="text-gray-600 text-sm font-normal">
            {stats.runtime.days} days {stats.runtime.hours} hours{' '}
            {stats.runtime.minutes} minutes
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            width={800}
            height={400}
            data={stats.moviesFromYear}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis
              dataKey="year"
              interval={0}
              angle={-90}
              dy={15}
              dx={-5}
              fontSize={10}
            />
            <YAxis />
            <Bar dataKey="count" fill="#219EBC" />
            <Tooltip />
          </BarChart>
        </ResponsiveContainer>

        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            width={800}
            height={400}
            data={stats.seenInYear}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis dataKey="year" interval={0} />
            <YAxis />
            <Bar dataKey="count" fill="#219EBC" />
            <Tooltip />
          </BarChart>
        </ResponsiveContainer>

        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            width={800}
            height={400}
            data={stats.ratings}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis dataKey="rating" interval={0} />
            <YAxis />
            <Bar dataKey="count" fill="#219EBC" />
            <Tooltip />
          </BarChart>
        </ResponsiveContainer>

        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            width={800}
            height={400}
            data={stats.genres}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis
              dataKey="name"
              angle={-90}
              interval={0}
              height={100}
              dy={50}
              dx={-5}
              fontSize={11}
            />
            <YAxis />
            <Bar dataKey="count" fill="#219EBC" />
            <Tooltip />
          </BarChart>
        </ResponsiveContainer>
        <div className="mb-8">
          <h2 className="mb-2 text-lg font-bold">Most watched movies</h2>
          <ul className="text-sm grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
            {stats.rewatchedMovies.map(({ title, id, count }) => (
              <li key={id}>
                <Link
                  className="text-brandBlue-600 underline text-sm"
                  to={`/movie/${id}`}
                  prefetch="intent"
                >
                  {title} ({count})
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <People title="Cast" people={stats.persons.cast} />
          <People title="Director" people={stats.persons.directors} />
          <People title="Composer" people={stats.persons.composers} />
          <People title="Producer" people={stats.persons.producers} />
          <People title="Writer" people={stats.persons.writers} />
        </div>
      </div>
    </>
  )
}

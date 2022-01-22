import { user } from '@prisma/client'
import { CartesianGrid } from 'recharts'
import { XAxis, YAxis } from 'recharts'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer } from 'recharts'
import { LoaderFunction, Outlet, useLoaderData } from 'remix'
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

type Stats = {
  totalUniqueMovies: number
  totalNumberOfMoviesWithRewatches: number
  runtime: Runtime
  moviesFromYear: Array<YearCount>
  seenInYear: Array<YearCount>
}

type LoaderData = {
  user: user | null
  stats: Stats
}

export let loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request)
  const totalUniqueMovies = await db.seen.findMany({
    distinct: 'movie_id',
    where: { user_id: Number(user?.id) },
  })

  const totalNumberOfMoviesWithRewatches = await db.seen.count({
    where: { user_id: Number(user?.id) },
  })

  const moviesFromYear =
    await db.$queryRaw`SELECT COUNT(*), date_part('year', release_date) as year FROM movie GROUP BY date_part('year', release_date) ORDER BY year ASC;`

  const seenInYear =
    await db.$queryRaw`SELECT COUNT(*), date_part('year', date) as year FROM seen GROUP BY date_part('year', date) ORDER BY year ASC;`

  const allRuntimes = await db.seen.findMany({
    select: { movie: { select: { runtime: true } } },
    where: { user_id: Number(user?.id) },
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
      seenInYear,
      moviesFromYear,
    },
  } as LoaderData
}

export default function Stats() {
  const { user, stats } = useLoaderData<LoaderData>()

  return (
    <>
      <Navigation username={user?.username} />
      <div className="max-w-4xl mx-auto grid grid-cols-1 gap-5">
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
          <BarChart width={800} height={400} data={stats.moviesFromYear}>
            <CartesianGrid strokeDasharray="3" />
            <XAxis dataKey="year" angle={-45} interval={1} />
            <YAxis />
            <Bar dataKey="count" />
          </BarChart>
        </ResponsiveContainer>

        <ResponsiveContainer width="100%" height={400}>
          <BarChart width={800} height={400} data={stats.seenInYear}>
            <CartesianGrid strokeDasharray="3" />
            <XAxis dataKey="year" angle={-45} interval={1} />
            <YAxis />
            <Bar dataKey="count" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}

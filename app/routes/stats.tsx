import { user } from '@prisma/client'
import { CartesianGrid } from 'recharts'
import { XAxis, YAxis } from 'recharts'
import { Tooltip } from 'recharts'
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

type Rating = {
  count: number
  rating: number
}

type Stats = {
  totalUniqueMovies: number
  totalNumberOfMoviesWithRewatches: number
  runtime: Runtime
  moviesFromYear: Array<YearCount>
  seenInYear: Array<YearCount>
  ratings: Array<Rating>
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
      seenInYear,
      moviesFromYear,
      ratings,
    },
  } as LoaderData
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
            <XAxis dataKey="year" interval={3} />
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
      </div>
    </>
  )
}

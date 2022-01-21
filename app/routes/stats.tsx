import { user } from '@prisma/client'
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

type Stats = {
  totalUniqueMovies: number
  totalNumberOfMoviesWithRewatches: number
  runtime: Runtime
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

  const allRuntimes = await db.seen.findMany({
    select: { movie: { select: { runtime: true } } },
    where: { user_id: Number(user?.id) },
  })
  const totalRuntimeInMinutes = allRuntimes.reduce(
    (acc, { movie: { runtime } }) => acc + runtime,
    0
  )

  const days = totalRuntimeInMinutes / (24 * 60)
  const hours = (days % 1) * 60
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
    },
  } as LoaderData
}

export default function Stats() {
  const data = useLoaderData<LoaderData>()

  return (
    <>
      <Navigation username={data.user?.username} />
      <div className="max-w-4xl mx-auto grid grid-cols-1 gap-5">
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
          <div className="text-center font-bold text-2xl">
            {data.stats.totalUniqueMovies}
            <div className="text-gray-600 text-sm font-normal">
              unique movies
            </div>
          </div>
          <div className="text-center font-bold text-2xl">
            {data.stats.totalNumberOfMoviesWithRewatches}
            <div className="text-gray-600 text-sm font-normal">
              movies seen including rewatches
            </div>
          </div>
        </div>
        <div className="text-center font-bold text-2xl">
          {data.stats.runtime.totalRuntimeInMinutes} minutes
          <div className="text-gray-600 text-sm font-normal">
            {data.stats.runtime.days} days {data.stats.runtime.hours} hours{' '}
            {data.stats.runtime.minutes} minutes
          </div>
        </div>
      </div>
    </>
  )
}

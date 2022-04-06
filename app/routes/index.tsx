import type { movie, rating, seen, user } from '@prisma/client'
import React from 'react'
import { json, Link, LoaderFunction, redirect, useLoaderData } from 'remix'
import InputSelect from '~/components/InputSelect'
import Navigation from '~/components/navigation'
import Poster from '~/components/poster'
import { formatDate, yearFromDate } from '~/utils/date'
import { db } from '~/utils/db.server'
import { getUser } from '~/utils/session.server'

type LoaderData = {
  user: user | null
  year: string
  moviesInYear: number
  newMoviesInYear: number
  yearsWithWatches: Array<string>
  movies: Array<
    seen & {
      movie: Pick<movie, 'id' | 'title' | 'poster' | 'release_date'> & {
        rating: Array<rating>
      }
    }
  >
}

export let loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request)

  if (!user) {
    throw redirect('/login')
  }

  const url = new URL(request.url)
  const year =
    url.searchParams.get('year') ?? new Date().getFullYear().toString()

  const filterByYear = {
    where: {
      user_id: Number(user?.id),
      date: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      },
    },
  }

  const yearsWithWatches: Array<{ year: string }> =
    await db.$queryRaw`SELECT date_part('year', date)::TEXT as year FROM seen GROUP by year ORDER BY year ASC;`

  return json<LoaderData>({
    year,
    yearsWithWatches:
      yearsWithWatches.map((row: { year: string }) => row.year) ?? [],
    moviesInYear: await db.seen.count(filterByYear),
    newMoviesInYear: await db.movie.count({
      where: {
        seen: {
          every: {
            ...filterByYear.where,
          },
        },
      },
    }),
    movies: await db.seen.findMany({
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            release_date: true,
            poster: true,
            rating: { where: { user_id: Number(user?.id) } },
          },
        },
      },
      orderBy: { date: 'desc' },
      ...filterByYear,
    }),
    user,
  })
}

export default function Index() {
  const data = useLoaderData<LoaderData>()
  const formRef = React.useRef<HTMLFormElement>(null)

  return (
    <>
      <Navigation username={data.user?.username} />
      <div className="grid grid-feed mb-10 gap-y-5 md:gap-8">
        {data.moviesInYear > 0 ? (
          <>
            <form className="col-start-3 col-end-3" method="post" ref={formRef}>
              <InputSelect
                defaultValue={data.year}
                name="year"
                onChange={() => formRef.current?.submit()}
                options={data.yearsWithWatches.map((year) => ({
                  value: year,
                  label: year,
                }))}
              />
            </form>
            <ul className="col-start-3 col-end-3 grid-cols-1 sm:grid-cols-2 grid md:grid-cols-4 gap-5">
              {data.movies.map(({ date, movie }) => (
                <li key={movie.id}>
                  <Link to={`/movie/${movie.id}`} prefetch="intent">
                    <Poster image={movie.poster} title={movie.title} />
                    <div className="mt-4 text-gray-700 text-sm font-semibold">
                      {movie.title}
                    </div>
                    <span className="text-xs">
                      {movie.release_date && yearFromDate(movie.release_date)}
                      {movie.rating.length > 0 && date && ' - '}
                      {formatDate(date)}
                      {movie.release_date && movie.rating.length > 0 && ' - '}
                      {movie.rating.length > 0
                        ? `${movie.rating[0].rating}/10`
                        : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="col-span-full mt-5 text-gray-600 text-center text-sm">
              Movies in year: {data.moviesInYear} | New movies this year:{' '}
              {data.newMoviesInYear}
            </div>
          </>
        ) : (
          <div className="col-start-3 col-end-3 bg-gray-100 text-center p-5">
            No movies this year. Try another year.
          </div>
        )}
      </div>
    </>
  )
}

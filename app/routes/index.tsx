import type { movie, rating, seen, user } from '@prisma/client'
import React from 'react'
import { Link, LoaderFunction, redirect, useLoaderData } from 'remix'
import Navigation from '~/components/navigation'
import Poster from '~/components/poster'
import { formatDate, yearFromDate } from '~/utils/date'
import { db } from '~/utils/db.server'
import { getUser } from '~/utils/session.server'
import { SelectorIcon } from '@heroicons/react/solid'

type LoaderData = {
  user: user | null
  year: string
  moviesInYear: number
  newMoviesInYear: number
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

  const data: LoaderData = {
    year,
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
  }

  return data
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
              <div className="w-32 border border-gray-200 rounded-sm relative">
                <select
                  className="appearance-none w-full p-2 pl-4"
                  name="year"
                  defaultValue={data.year}
                  onChange={() => formRef.current?.submit()}
                >
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                  <option value="2020">2020</option>
                  <option value="2019">2019</option>
                  <option value="2018">2018</option>
                  <option value="2017">2017</option>
                  <option value="2016">2016</option>
                  <option value="2015">2015</option>
                  <option value="2014">2014</option>
                  <option value="2013">2013</option>
                  <option value="2012">2012</option>
                </select>
                <div className="absolute inset-y-0 w-4 right-2 flex items-center pointer-events-none text-gray-500">
                  <SelectorIcon />
                </div>
              </div>
            </form>
            <ul className="col-start-3 col-end-3 grid-cols-1 sm:grid-cols-2 grid md:grid-cols-4 gap-5">
              {data.movies.map(({ date, movie }) => (
                <li key={movie.id}>
                  <Link to={`/movie/${movie.id}`} prefetch="intent">
                    <Poster image={movie.poster} />
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

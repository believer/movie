import type { movie, rating } from '@prisma/client'
import React from 'react'
import type { LoaderFunction } from 'remix'
import { Link, useLoaderData } from 'remix'
import Poster from '~/components/poster'
import { db } from '~/utils/db.server'

type LoaderData = {
  year: string
  moviesInYear: number
  movies: Array<
    Pick<movie, 'id' | 'title' | 'poster'> & { rating: Array<rating> }
  >
}

export let loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)
  const year =
    url.searchParams.get('year') ?? new Date().getFullYear().toString()

  const filterByYear = {
    where: {
      seen: {
        every: {
          date: {
            gte: new Date(`${year}-01-01`),
            lte: new Date(`${year}-12-31`),
          },
        },
      },
    },
  }

  const data: LoaderData = {
    year,
    moviesInYear: await db.movie.count(filterByYear),
    movies: await db.movie.findMany({
      select: { id: true, title: true, poster: true, rating: true },
      orderBy: { id: 'desc' },
      ...filterByYear,
    }),
  }

  return data
}

export default function Index() {
  const data = useLoaderData<LoaderData>()
  const formRef = React.useRef<HTMLFormElement>(null)

  return (
    <div className="grid grid-feed my-10">
      <form
        className="col-start-3 col-end-3 mb-5 ml-auto"
        method="post"
        ref={formRef}
      >
        <select
          id=""
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
      </form>
      {data.moviesInYear > 0 ? (
        <>
          <ul className="col-start-3 col-end-3 grid-cols-1 md:grid-cols-2 grid lg:grid-cols-4 gap-5">
            {data.movies.map((movie) => (
              <li key={movie.id}>
                <Link to={`/movie/${movie.id}`} prefetch="intent">
                  <Poster image={movie.poster} />
                  <div className="mt-4 text-gray-700 text-sm font-semibold">
                    {movie.title}
                  </div>
                  {movie.rating.length > 0 ? (
                    <span className="text-xs">{movie.rating[0].rating}/10</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
          <div className="col-span-full mt-5 text-gray-600 text-center text-sm">
            Movies in year: {data.moviesInYear}
          </div>
        </>
      ) : (
        <div className="col-start-3 col-end-3 bg-gray-100 text-center p-5">
          No movies this year. Try another year.
        </div>
      )}
    </div>
  )
}

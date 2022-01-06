import { Link, useLoaderData } from 'remix'
import type { LoaderFunction } from 'remix'
import type { movie, rating } from '@prisma/client'
import { db } from '~/utils/db.server'
import Poster from '~/components/poster'

type LoaderData = {
  movies: Array<
    Pick<movie, 'id' | 'title' | 'poster'> & { rating: Array<rating> }
  >
}

export let loader: LoaderFunction = async () => {
  const data: LoaderData = {
    movies: await db.movie.findMany({
      take: 20,
      select: { id: true, title: true, poster: true, rating: true },
      orderBy: { id: 'desc' },
    }),
  }

  return data
}

export default function Index() {
  const data = useLoaderData<LoaderData>()

  return (
    <div className="grid grid-feed my-10">
      <ul className="col-start-3 col-end-3 grid-cols-1 md:grid-cols-2 grid lg:grid-cols-4 gap-5">
        {data.movies.map((movie) => {
          return (
            <li key={movie.id}>
              <Link to={`/movie/${movie.id}`}>
                <Poster image={movie.poster} />
                <div className="mt-4 text-gray-700 text-sm font-semibold">
                  {movie.title}
                </div>
                <span className="text-xs">{movie.rating[0].rating}/10</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

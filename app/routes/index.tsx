import { Link, useLoaderData } from 'remix'
import type { LoaderFunction } from 'remix'
import type { movie } from '@prisma/client'
import { db } from '~/utils/db.server'
import Poster from '~/components/poster'

type LoaderData = {
  movies: Array<Pick<movie, 'id' | 'title' | 'poster'>>
}

export let loader: LoaderFunction = async () => {
  const data: LoaderData = {
    movies: await db.movie.findMany({
      take: 20,
      select: { id: true, title: true, poster: true },
      orderBy: { id: 'desc' },
    }),
  }

  return data
}

export default function Index() {
  const data = useLoaderData<LoaderData>()

  return (
    <div className="mx-auto max-w-4xl my-8">
      <ul className="grid grid-cols-4 gap-4">
        {data.movies.map((movie) => {
          return (
            <li key={movie.id}>
              <Link
                className="font-bold text-gray-700 text-sm"
                to={`/movie/${movie.id}`}
              >
                <Poster image={movie.poster} />
                <div className="mt-4">{movie.title}</div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

import { movie, rating, seen } from '@prisma/client'
import { LoaderFunction, useLoaderData } from 'remix'
import { formatDate } from '~/utils/date'
import { db } from '~/utils/db.server'

type LoaderData = {
  movies: Array<
    Pick<seen, 'date'> & {
      movie: Pick<movie, 'id' | 'title'> & { rating: Array<rating> }
    }
  >
}

export let loader: LoaderFunction = async ({ params }) => {
  const id = Number(params.id)

  const movies = await db.seen.findMany({
    select: {
      date: true,
      movie: {
        select: { title: true, id: true, rating: { where: { user_id: id } } },
      },
    },
    where: { user_id: id },
    orderBy: {
      date: 'desc',
    },
    take: 20,
  })

  return { movies }
}

export default function Friends() {
  const { movies } = useLoaderData<LoaderData>()

  return (
    <ul className="space-y-2">
      {movies.map(({ date, movie }) => {
        const rating = movie.rating?.[0].rating
        let ratingColor = 'text-green-600'

        if (rating < 6) {
          ratingColor = 'text-brandYellow-600'
        } else if (rating < 3) {
          ratingColor = 'text-brandOrange-600'
        }

        return (
          <li
            className="border-b border-dashed border-brandOrange-400 pb-2"
            key={movie.id}
          >
            <div className="flex justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-700">
                  {movie.title}
                </div>
                <div className="text-xs text-gray-400">{formatDate(date)}</div>
              </div>
              <div className="text-xs flex items-center text-gray-500">
                <span className={`text-base ${ratingColor}`}>{rating}</span>/10
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

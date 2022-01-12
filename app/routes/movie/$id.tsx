import { genre, job, movie, person, rating, seen } from '@prisma/client'
import {
  ActionFunction,
  Link,
  LoaderFunction,
  redirect,
  useLoaderData,
} from 'remix'
import Poster from '~/components/poster'
import { H1, H2 } from '~/components/typography'
import { db } from '~/utils/db.server'
import { getUserId } from '~/utils/session.server'

const dateFormatter = new Intl.DateTimeFormat('sv-SE')

type LoaderData = {
  movie: movie & {
    rating: Array<rating>
    movie_person: Array<{ person: person; job: job }>
    movie_genre: Array<{ genre: genre }>
    seen: Array<Pick<seen, 'date'>>
  }
  cast: Array<{ person: person; job: job }>
  crew: Array<{ person: person; job: job }>
}

export let loader: LoaderFunction = async ({ params, request }) => {
  const user_id = await getUserId(request)
  const id = Number(params.id)

  if (!user_id) {
    throw redirect('/login')
  }

  const movie = await db.movie.findUnique({
    where: { id },
    include: {
      rating: { where: { user_id } },
      seen: {
        select: { date: true },
        where: { user_id },
        orderBy: { date: 'desc' },
      },
      movie_genre: { select: { genre: true } },
      movie_person: {
        select: { job: true, person: true },
        orderBy: {
          person: {
            movie_person: { _count: 'desc' },
          },
        },
      },
    },
  })

  if (!movie) {
    throw new Error('No movie found')
  }

  const cast = movie.movie_person.filter(({ job }) => job === 'cast')
  const crew = movie.movie_person.filter(({ job }) => job !== 'cast')

  return { movie, cast, crew }
}

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData()
  const id = Number(form.get('id'))
  const user_id = await getUserId(request)

  if (!user_id) {
    throw redirect('/login')
  }

  await db.seen.create({
    data: {
      date: new Date().toISOString(),
      movie_id: id,
      user_id,
    },
  })

  return redirect(`/movie/${id}`)
}

export default function MoviePage() {
  const { movie, cast, crew } = useLoaderData<LoaderData>()

  const rating = movie.rating[0]?.rating

  return (
    <div className="my-10 mx-5 lg:mx-0">
      <div className="grid lg:grid-movie gap-8">
        <div className="lg:col-start-3 lg:col-end-4">
          <Link to="/">Back</Link>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-movie gap-8 mt-8">
        <div className="lg:col-start-3 lg:col-end-4">
          <div className="w-60 mb-5">
            <Poster image={movie.poster} />
          </div>
          <H1>{movie.title}</H1>
          <div className="mt-2 mb-4 flex text-xs text-gray-600">
            {movie.movie_genre.map(({ genre }) => genre.name).join(', ')}
          </div>
          {rating && (
            <div className="flex space-x-2 mb-4 items-center">
              <div>{[...Array(rating).keys()].map(() => '⭐️')}</div>
              <div className="text-sm text-gray-500 font-bold">
                {rating} / 10
              </div>
            </div>
          )}
          <p>{movie.overview}</p>
          {movie.seen.length > 0 && (
            <>
              <H2>Seen</H2>
              <ul className="mb-4 text-sm text-gray-600">
                {movie.seen
                  .map(({ date }) => dateFormatter.format(new Date(date)))
                  .map((date) => (
                    <li className="tabular-nums" key={date}>
                      {date}
                    </li>
                  ))}
              </ul>
              <form method="post">
                <input type="hidden" value={movie.id} name="id" />
                <button className="bg-gray-200 px-2 py-1 rounded" type="submit">
                  Add new watch
                </button>
              </form>
            </>
          )}
        </div>
        <div className="lg:col-start-4 lg:col-end-5">
          <H2>Cast</H2>
          <ul className="grid grid-cols-2 lg:grid-cols-3 gap-y-1">
            {cast.map(({ person }) => (
              <li key={person.id}>
                <Link
                  className="text-blue-700 underline text-sm"
                  to={`/person/${person.id}`}
                  prefetch="intent"
                >
                  {person.name}
                </Link>
              </li>
            ))}
          </ul>
          <H2>Crew</H2>
          <ul className="grid grid-cols-2 lg:grid-cols-3 gap-y-1">
            {crew.map(({ job, person }) => (
              <li key={person.id} className="flex items-center space-x-2">
                <Link
                  className="text-blue-700 underline text-sm"
                  to={`/person/${person.id}`}
                  prefetch="intent"
                >
                  {person.name}
                </Link>
                <span className="text-xs text-gray-500">{job}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

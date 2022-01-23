import type { movie } from '@prisma/client'
import { ActionFunction, LoaderFunction, redirect } from 'remix'
import { Form, useLoaderData } from 'remix'
import { Input } from '~/components/form'
import { db } from '~/utils/db.server'
import { getUserId } from '~/utils/session.server'

type Movie = Pick<movie, 'id' | 'title' | 'overview'>

type LoaderData = {
  movie: Movie
}

export const loader: LoaderFunction = async ({ request }) => {
  const results: Array<Movie> = await db.$queryRaw`
    SELECT id, title, overview FROM movie
    WHERE id NOT IN (SELECT movie_id FROM rating WHERE user_id = 1)
    LIMIT 1;`

  return { movie: results[0] } as LoaderData
}

export const action: ActionFunction = async ({ request }) => {
  const user_id = await getUserId(request)
  const form = await request.formData()

  const rating = Number(form.get('rating')!)
  const movie_id = Number(form.get('imdbId')!)

  if (!user_id) {
    throw redirect('/login')
  }

  await db.rating.create({
    data: {
      user_id,
      rating,
      movie_id,
    },
  })

  return null
}

export default function QuickRate() {
  const { movie } = useLoaderData<LoaderData>()

  return (
    <>
      <div className="md:mx-auto max-w-xl my-10 mx-5">
        <h1 className="text-4xl">{movie.title}</h1>
        <p className="my-5">{movie.overview}</p>
        <Form reloadDocument method="post">
          <input type="hidden" name="imdbId" value={movie.id} />
          <Input
            autoFocus
            type="number"
            max="10"
            min="0"
            label="Rating"
            name="rating"
            required
            defaultValue=""
            pattern="\d+"
          />
          <div className="mt-4">
            <button
              className="w-full bg-brandBlue-500 text-sm p-2 rounded text-white"
              type="submit"
            >
              Add rating
            </button>
          </div>
        </Form>
      </div>
    </>
  )
}

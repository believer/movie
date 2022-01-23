import type { movie, user } from '@prisma/client'
import {
  ActionFunction,
  Form,
  Link,
  LoaderFunction,
  redirect,
  useLoaderData,
} from 'remix'
import { Input } from '~/components/form'
import Navigation from '~/components/navigation'
import { yearFromDate } from '~/utils/date'
import { db } from '~/utils/db.server'
import { getUser } from '~/utils/session.server'

type LoaderData = {
  user: user | null
  query: string
  results: Array<Pick<movie, 'id' | 'title' | 'release_date'>>
}

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request)
  const url = new URL(request.url)
  const query = url.searchParams.get('query') ?? ''

  const results = await db.movie.findMany({
    select: { id: true, title: true, release_date: true },
    where: {
      title: {
        mode: 'insensitive',
        search: decodeURI(query).replace(/\s/g, ' & '),
      },
    },
    orderBy: { release_date: 'desc' },
  })

  return { query, results, user }
}

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData()
  const query = form.get('query')?.toString() ?? ''

  return redirect(`/search?query=${encodeURI(query)}`)
}

export default function SearchPage() {
  const { query, results, user } = useLoaderData<LoaderData>()

  return (
    <>
      <Navigation username={user?.username} />
      <div className="md:mx-auto max-w-xl my-10 mx-5">
        <Form replace className="my-5" method="post">
          <Input label="Search" type="text" name="query" defaultValue={query} />
        </Form>
        {results.length > 0 && (
          <ul className="space-y-2">
            {results.map((movie) => (
              <li key={movie.id} className="flex space-x-2 items-center">
                <Link
                  className="text-brandBlue-600 underline text-sm"
                  to={`/movie/${movie.id}`}
                  prefetch="intent"
                >
                  {movie.title}
                </Link>
                {movie.release_date && (
                  <span className="text-xs">
                    ({yearFromDate(movie.release_date)})
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {results.length === 0 && query !== '' && (
          <div className="bg-gray-100 text-center p-5">
            Nothing matches <strong>{query}</strong>
          </div>
        )}
      </div>
    </>
  )
}

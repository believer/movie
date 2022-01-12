import { movie } from '@prisma/client'
import {
  ActionFunction,
  Link,
  LoaderFunction,
  redirect,
  useLoaderData,
} from 'remix'
import { db } from '~/utils/db.server'

const dateFormatter = new Intl.DateTimeFormat('sv-SE', { year: 'numeric' })

type LoaderData = {
  query: string
  results: Array<Pick<movie, 'id' | 'title' | 'release_date'>>
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)
  const query = url.searchParams.get('query') ?? ''

  console.log(decodeURI(query))

  const results = await db.movie.findMany({
    select: { id: true, title: true, release_date: true },
    where: { title: { mode: 'insensitive', contains: decodeURI(query) } },
    orderBy: { release_date: 'desc' },
  })

  return { query, results }
}

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData()
  const query = form.get('query')?.toString() ?? ''

  return redirect(`?query=${encodeURI(query)}`)
}

export default function SearchPage() {
  const { query, results } = useLoaderData<LoaderData>()

  return (
    <div className="mx-auto max-w-xl my-10">
      <Link to="/">Back</Link>
      <form className="my-5" method="post">
        <input
          className="border border-gray-700 w-full px-2 py-1"
          type="text"
          name="query"
          defaultValue={query}
        />
      </form>
      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map((movie) => (
            <li key={movie.id} className="flex space-x-2 items-center">
              <Link
                className="text-blue-700 underline text-sm"
                to={`/movie/${movie.id}`}
                prefetch="intent"
              >
                {movie.title}
              </Link>
              {movie.release_date && (
                <span className="text-xs">
                  ({dateFormatter.format(new Date(movie.release_date))})
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
  )
}

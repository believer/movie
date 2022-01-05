import { movie, person } from '@prisma/client'
import { Link, LoaderFunction, useLoaderData } from 'remix'
import { db } from '~/utils/db.server'

type LoaderData = {
  person: person & { movie_person: Array<{ movie: movie }> }
}

export let loader: LoaderFunction = async ({ params }) => {
  const person = await db.person.findUnique({
    where: { id: Number(params.id) },
    include: {
      movie_person: { select: { movie: true } },
    },
  })

  if (!person) {
    throw new Error('No person found')
  }

  return { person }
}

export default function MoviePage() {
  const { person } = useLoaderData<LoaderData>()

  return (
    <div className="mx-auto max-w-4xl my-8">
      <Link to="/">Back</Link>
      <h1 className="text-4xl font-bold">{person.name}</h1>
      <ul className="mt-4 grid grid-cols-3">
        {person.movie_person.map(({ movie }) => (
          <li key={movie.id}>
            <Link to={`/movie/${movie.id}`}>{movie.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

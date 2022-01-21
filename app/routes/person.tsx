import { user } from '@prisma/client'
import { LoaderFunction, Outlet, useLoaderData } from 'remix'
import Navigation from '~/components/navigation'
import { getUser } from '~/utils/session.server'

type LoaderData = {
  user: user | null
}

export let loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request)

  return { user }
}

export default function Person() {
  const data = useLoaderData<LoaderData>()

  return (
    <>
      <Navigation username={data.user?.username} /> <Outlet />
    </>
  )
}

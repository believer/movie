import type { user } from '@prisma/client'
import type { LoaderFunction } from 'remix'
import { NavLink, Outlet, useLoaderData } from 'remix'
import Gravatar from '~/components/gravatar'
import Navigation from '~/components/navigation'
import { db } from '~/utils/db.server'
import { getUser } from '~/utils/session.server'

type LoaderData = {
  allUsers: Array<user>
  user: user | null
}

export let loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request)

  const allUsers = await db.user.findMany({
    where: { NOT: { id: Number(user?.id) } },
  })

  return { user, allUsers }
}

export default function Friends() {
  const { user, allUsers } = useLoaderData<LoaderData>()

  return (
    <>
      <Navigation username={user?.username} />
      <div className="max-w-4xl lg:mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 mx-5">
        <ul className="space-y-2">
          {allUsers.map((user) => (
            <li className="flex items-center space-x-2" key={user.id}>
              <Gravatar email={user.username} />
              <NavLink
                className={({ isActive }) =>
                  `text-sm underline ${
                    isActive ? 'text-brandBlue-600' : 'text-gray-500'
                  }`
                }
                to={user.id.toString()}
              >
                {user.username}
              </NavLink>
            </li>
          ))}
        </ul>
        <Outlet />
      </div>
    </>
  )
}

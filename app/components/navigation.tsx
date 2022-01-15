import md5 from 'md5'
import { Link, NavLink } from 'remix'

export default function Navigation({ username }: { username?: string }) {
  return (
    <nav className="col-span-full mb-5 flex items-center px-5 sm:px-20 bg-white border-b border-gray-200 justify-between">
      <div className="flex space-x-4 sm:space-x-8 items-center">
        <Link className="text-2xl font-bold" to="/">
          🍿
        </Link>
        <div className="space-x-4 flex items-center">
          <NavLink
            className={({ isActive }) =>
              `text-sm border-b-2 py-4 ${
                isActive
                  ? 'text-gray-800 border-brandBlue-500'
                  : 'text-gray-500 border-transparent'
              }`
            }
            to="/movie/new"
          >
            Add new movie
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `text-sm border-b-2 py-4 ${
                isActive
                  ? 'text-gray-800 border-brandBlue-500'
                  : 'text-gray-500 border-transparent'
              }`
            }
            to="/search"
          >
            Search
          </NavLink>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <form action="/logout" method="post" className="flex space-x-2">
          <button type="submit" className="button">
            <img
              className="rounded-full w-8"
              src={`https://www.gravatar.com/avatar/${md5(username ?? '')}`}
            />
          </button>
        </form>
      </div>
    </nav>
  )
}

import bcrypt from 'bcryptjs'
import { createCookieSessionStorage, redirect } from 'remix'
import { db } from './db.server'

type LoginForm = {
  username: string
  password: string
}

export async function login({ username, password }: LoginForm) {
  const user = await db.user.findUnique({
    where: { username },
  })

  if (!user) {
    return null
  }

  const isCorrectPassword = await bcrypt.compare(password, user.password_hash)

  if (!isCorrectPassword) {
    return null
  }

  return user
}

const sessionSecret = process.env.SESSION_SECRET

if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set')
}

const storage = createCookieSessionStorage({
  cookie: {
    name: 'movies_session',
    secure: process.env.NODE_ENV === 'production',
    secrets: [sessionSecret],
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
})

export function getUserSession(request: Request) {
  return storage.getSession(request.headers.get('Cookie'))
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request)
  const userId = session.get('userId')

  if (!userId) {
    return null
  }

  return Number(userId)
}

export async function getUser(request: Request) {
  const userId = await getUserId(request)

  if (typeof userId !== 'number') {
    return null
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    return user
  } catch {
    throw logout(request)
  }
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const session = await getUserSession(request)
  const userId = session.get('userId')

  if (!userId) {
    const searchParams = new URLSearchParams([['redirectTo', redirectTo]])
    throw redirect(`/login?${searchParams}`)
  }

  return Number(userId)
}

export async function createUserSession(userId: number, redirectTo: string) {
  const session = await storage.getSession()
  session.set('userId', userId)

  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await storage.commitSession(session),
    },
  })
}

export async function logout(request: Request) {
  const session = await storage.getSession(request.headers.get('Cookie'))

  return redirect('/login', {
    headers: {
      'Set-Cookie': await storage.destroySession(session),
    },
  })
}

export async function register({ username, password }: LoginForm) {
  const password_hash = await bcrypt.hash(password, 10)

  return db.user.create({
    data: { username, password_hash },
  })
}

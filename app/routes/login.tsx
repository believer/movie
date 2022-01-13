import type { ActionFunction } from 'remix'
import { json, useActionData, useSearchParams } from 'remix'
import { Input } from '~/components/form'
import { db } from '~/utils/db.server'
import { createUserSession, login, register } from '~/utils/session.server'

function validateUsername(username: unknown) {
  if (typeof username !== 'string' || username.length < 3) {
    return `Usernames must be at least 3 characters long`
  }
}

function validatePassword(password: unknown) {
  if (typeof password !== 'string' || password.length < 6) {
    return `Passwords must be at least 6 characters long`
  }
}

type ActionData = {
  formError?: string
  fieldErrors?: {
    username: string | undefined
    password: string | undefined
  }
  fields?: {
    loginType: string
    username: string
    password: string
  }
}

const badRequest = (data: ActionData) => json(data, { status: 400 })

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData()
  const loginType = form.get('loginType')
  const username = form.get('username')
  const password = form.get('password')
  const redirectTo = form.get('redirectTo') || '/'

  if (
    typeof loginType !== 'string' ||
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    typeof redirectTo !== 'string'
  ) {
    return badRequest({
      formError: `Form not submitted correctly.`,
    })
  }

  const fields = { loginType, username, password }
  const fieldErrors = {
    username: validateUsername(username),
    password: validatePassword(password),
  }
  if (Object.values(fieldErrors).some(Boolean))
    return badRequest({ fieldErrors, fields })

  switch (loginType) {
    case 'login': {
      const user = await login({ username, password })

      if (!user) {
        return badRequest({
          fields,
          formError: `Username/Password combination is incorrect`,
        })
      }

      return createUserSession(user.id, redirectTo)
    }
    case 'register': {
      const userExists = await db.user.findFirst({
        where: { username },
      })
      if (userExists) {
        return badRequest({
          fields,
          formError: `User with username ${username} already exists`,
        })
      }
      const user = await register({ username, password })

      if (!user) {
        return badRequest({
          fields,
          formError: `Something went wrong trying to create a new user.`,
        })
      }

      return createUserSession(user.id, redirectTo)
    }
    default: {
      return badRequest({
        fields,
        formError: `Login type invalid`,
      })
    }
  }
}

export default function Login() {
  const actionData = useActionData<ActionData>()
  const [searchParams] = useSearchParams()

  return (
    <div className="bg-gray-100 h-screen flex items-center justify-center flex-col">
      <h1 className="text-6xl font-bold">🍿</h1>
      <div className="w-96 p-5 rounded-lg bg-white shadow-lg mt-10">
        <form
          method="post"
          aria-describedby={
            actionData?.formError ? 'form-error-message' : undefined
          }
        >
          <input
            type="hidden"
            name="redirectTo"
            value={searchParams.get('redirectTo') ?? undefined}
          />
          <fieldset className="flex justify-center">
            <legend className="sr-only">Login or Register?</legend>
            <label className="mr-4 text-gray-500 text-sm font-semibold">
              <input
                className="mr-2"
                type="radio"
                name="loginType"
                value="login"
                defaultChecked={
                  !actionData?.fields?.loginType ||
                  actionData?.fields?.loginType === 'login'
                }
              />
              Login
            </label>
            <label className="text-gray-500 text-sm font-semibold">
              <input
                className="mr-2"
                type="radio"
                name="loginType"
                value="register"
                defaultChecked={actionData?.fields?.loginType === 'register'}
              />
              Register
            </label>
          </fieldset>
          <div className="my-5">
            <Input
              type="email"
              label="Username"
              name="username"
              defaultValue={actionData?.fields?.username}
              aria-invalid={Boolean(actionData?.fieldErrors?.username)}
              aria-describedby={
                actionData?.fieldErrors?.username ? 'username-error' : undefined
              }
            />
            {actionData?.fieldErrors?.username ? (
              <p
                className="form-validation-error"
                role="alert"
                id="username-error"
              >
                {actionData?.fieldErrors.username}
              </p>
            ) : null}
          </div>
          <div>
            <Input
              type="password"
              label="Password"
              name="password"
              defaultValue={actionData?.fields?.password}
              invalid={Boolean(actionData?.fieldErrors?.password) || undefined}
              describedBy={
                actionData?.fieldErrors?.password ? 'password-error' : undefined
              }
            />
            {actionData?.fieldErrors?.password ? (
              <p
                className="form-validation-error"
                role="alert"
                id="password-error"
              >
                {actionData?.fieldErrors.password}
              </p>
            ) : null}
          </div>
          <div>
            {actionData?.formError ? (
              <p className="text-sm text-red-600 mt-2" role="alert">
                {actionData?.formError}
              </p>
            ) : null}
          </div>
          <button
            className="bg-brandBlue-500 w-full p-2 text-white rounded mt-4 text-sm"
            type="submit"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}

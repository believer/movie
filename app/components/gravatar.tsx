import md5 from 'md5'

export default function Gravatar({ email }: { email?: string }) {
  return (
    <img
      className="rounded-full w-8"
      src={`https://www.gravatar.com/avatar/${md5(email ?? '')}`}
    />
  )
}

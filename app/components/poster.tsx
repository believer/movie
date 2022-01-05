type PosterProps = { image: string | null }

export default function Poster({ image }: PosterProps) {
  if (!image) {
    return null
  }

  return (
    <img
      className="rounded-sm"
      src={`https://image.tmdb.org/t/p/w500/${image}`}
    />
  )
}

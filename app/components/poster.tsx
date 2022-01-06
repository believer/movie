type PosterProps = { image: string | null }

export default function Poster({ image }: PosterProps) {
  if (!image) {
    return null
  }

  return (
    <img
      className="rounded-sm max-w-full"
      src={`https://image.tmdb.org/t/p/w500${image}`}
    />
  )
}

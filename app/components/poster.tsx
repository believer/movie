type PosterProps = { image: string | null; title: string }

export default function Poster({ image, title }: PosterProps) {
  if (!image) {
    return null
  }

  return (
    <img
      alt={title}
      className="rounded max-w-full"
      src={`https://image.tmdb.org/t/p/w500${image}`}
    />
  )
}

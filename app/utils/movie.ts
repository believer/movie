import { movie, rating, seen } from '@prisma/client'
import { formatDate, yearFromDate } from './date'

export type MovieWithSeenAndRating = Partial<seen> &
  Partial<movie> & {
    rating: Array<rating>
  }

export const movieMeta = (movie: MovieWithSeenAndRating) => {
  let meta = []

  if (movie.release_date) {
    meta.push(yearFromDate(movie.release_date))
  }

  if (movie.date) {
    meta.push(formatDate(movie.date))
  }

  if (movie.rating?.length > 0) {
    meta.push(`${movie.rating[0].rating}/10`)
  }

  return meta.join(' - ')
}

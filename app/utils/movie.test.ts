import { movieMeta, MovieWithSeenAndRating } from './movie'

describe('#movieMeta', () => {
  test('handles only release date', () => {
    const meta = movieMeta({
      release_date: new Date(2020, 0, 1),
    } as MovieWithSeenAndRating)

    expect(meta).toEqual('2020')
  })

  test('handles only seen date', () => {
    const meta = movieMeta({
      date: new Date(2020, 1, 1),
    } as MovieWithSeenAndRating)

    expect(meta).toEqual('2020-02-01')
  })

  test('handles only rating', () => {
    const meta = movieMeta({
      rating: [{ rating: 7 }],
    } as MovieWithSeenAndRating)

    expect(meta).toEqual('7/10')
  })

  test('handles release date and date', () => {
    const meta = movieMeta({
      release_date: new Date(2020, 0, 1),
      date: new Date(2020, 1, 1),
    } as MovieWithSeenAndRating)

    expect(meta).toEqual('2020 - 2020-02-01')
  })

  test('handles release date and rating', () => {
    const meta = movieMeta({
      release_date: new Date(2020, 0, 1),
      rating: [{ rating: 7 }],
    } as MovieWithSeenAndRating)

    expect(meta).toEqual('2020 - 7/10')
  })

  test('handles all fields', () => {
    const meta = movieMeta({
      release_date: new Date(2020, 0, 1),
      date: new Date(2020, 1, 1),
      rating: [{ rating: 7 }],
    } as MovieWithSeenAndRating)

    expect(meta).toEqual('2020 - 2020-02-01 - 7/10')
  })
})

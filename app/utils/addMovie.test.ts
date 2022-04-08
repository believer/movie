import { imdbId } from './addMovie.server'

describe('#imdbId', () => {
  test('handles tmdb id', () => {
    expect(imdbId('0111161')).toEqual('0111161')
  })

  test('handles imdb id', () => {
    expect(imdbId('tt0111161')).toEqual('tt0111161')
  })

  test('handles imdb url', () => {
    expect(
      imdbId('https://www.imdb.com/title/tt7767422/?ref_=nm_knf_t1')
    ).toEqual('tt7767422')
  })
})

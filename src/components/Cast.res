module CastFragment = %relay(`
  fragment Cast_movie on movie {
    cast: movie_people(
      where: {job: {_eq: "cast"}},
      order_by: {person: {movie_people_aggregate: {count: desc}}}
    ) {
      person {
        id
        name
      }
    }
  }
`)

@react.component
let make = (~movie) => {
  let data = CastFragment.use(movie)

  <MovieSection title="Cast">
    {data.cast
    ->Belt.Array.map(({person}) =>
      <li key=person.id> <Link to_=Person(person.id)> {React.string(person.name)} </Link> </li>
    )
    ->React.array}
  </MovieSection>
}

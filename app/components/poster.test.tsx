import { render, screen } from '@testing-library/react'
import Poster from './poster'

test('returns null when no image is provided', () => {
  const { container } = render(
    <Poster image={null} title="Requiem for a Dream" />
  )

  expect(container.firstChild).toBeNull()
})

test('displays image', () => {
  render(<Poster image="/test.jpg" title="Requiem for a Dream" />)

  expect(screen.getByAltText(/requiem for a dream/i)).toHaveProperty(
    'src',
    `https://image.tmdb.org/t/p/w500/test.jpg`
  )
})

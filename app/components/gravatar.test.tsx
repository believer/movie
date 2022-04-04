import { render, screen } from '@testing-library/react'
import Gravatar from './gravatar'

test('renders gravatar with alt text', () => {
  render(<Gravatar email="test@test.com" />)

  expect(screen.getByAltText('test@test.com')).toBeInTheDocument()
})

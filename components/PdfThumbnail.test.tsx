import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'

vi.mock('react-pdf', () => ({
  Document: ({ children, loading }: any) => (
    <div data-testid="pdf-doc">{children ?? loading}</div>
  ),
  Page: ({ pageNumber, width }: any) => (
    <div data-testid="pdf-page" data-page={pageNumber} data-width={width} />
  ),
  pdfjs: { GlobalWorkerOptions: { workerSrc: '' }, version: '3.0.0' },
}))

import PdfThumbnail from './PdfThumbnail'

describe('PdfThumbnail', () => {
  it('renders a PDF Document with the given url', () => {
    render(<PdfThumbnail url="https://example.com/test.pdf" />)
    expect(screen.getByTestId('pdf-doc')).toBeInTheDocument()
  })

  it('renders page 1 at width 80', () => {
    render(<PdfThumbnail url="https://example.com/test.pdf" />)
    const page = screen.getByTestId('pdf-page')
    expect(page).toHaveAttribute('data-page', '1')
    expect(page).toHaveAttribute('data-width', '80')
  })
})

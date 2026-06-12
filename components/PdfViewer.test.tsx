import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('react-pdf', () => ({
  Document: ({ onLoadSuccess, children }: any) => {
    setTimeout(() => onLoadSuccess?.({ numPages: 5 }), 0)
    return <div data-testid="pdf-document">{children}</div>
  },
  Page: ({ pageNumber }: any) => (
    <div data-testid="pdf-page">Page {pageNumber}</div>
  ),
  pdfjs: { GlobalWorkerOptions: { workerSrc: '' }, version: '3.0.0' },
}))

import PdfViewer from './PdfViewer'

describe('PdfViewer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('shows page input with value 1 and total 5 after PDF loads', async () => {
    render(<PdfViewer url="test.pdf" courseId="course-1" />)
    await act(async () => { vi.runAllTimers() })
    expect(screen.getByRole('spinbutton')).toHaveValue(1)
    expect(screen.getByText('/ 5')).toBeInTheDocument()
  })

  it('advances to next page on ArrowRight key', async () => {
    render(<PdfViewer url="test.pdf" courseId="course-1" />)
    await act(async () => { vi.runAllTimers() })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByRole('spinbutton')).toHaveValue(2)
  })

  it('advances to next page on Space key', async () => {
    render(<PdfViewer url="test.pdf" courseId="course-1" />)
    await act(async () => { vi.runAllTimers() })
    fireEvent.keyDown(window, { key: ' ' })
    expect(screen.getByRole('spinbutton')).toHaveValue(2)
  })

  it('goes back on ArrowLeft key', async () => {
    render(<PdfViewer url="test.pdf" courseId="course-1" />)
    await act(async () => { vi.runAllTimers() })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByRole('spinbutton')).toHaveValue(2)
  })

  it('does not go before page 1', async () => {
    render(<PdfViewer url="test.pdf" courseId="course-1" />)
    await act(async () => { vi.runAllTimers() })
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByRole('spinbutton')).toHaveValue(1)
  })

  it('does not go past last page', async () => {
    render(<PdfViewer url="test.pdf" courseId="course-1" />)
    await act(async () => { vi.runAllTimers() })
    for (let i = 0; i < 10; i++) {
      fireEvent.keyDown(window, { key: 'ArrowRight' })
    }
    expect(screen.getByRole('spinbutton')).toHaveValue(5)
  })

  it('previous button is disabled on page 1', async () => {
    render(<PdfViewer url="test.pdf" courseId="course-1" />)
    await act(async () => { vi.runAllTimers() })
    expect(screen.getByRole('button', { name: /ย้อนกลับ/ })).toBeDisabled()
  })

  it('next button is disabled on last page', async () => {
    render(<PdfViewer url="test.pdf" courseId="course-1" />)
    await act(async () => { vi.runAllTimers() })
    for (let i = 0; i < 4; i++) {
      fireEvent.keyDown(window, { key: 'ArrowRight' })
    }
    expect(screen.getByRole('button', { name: /ถัดไป/ })).toBeDisabled()
  })

  it('zoom level starts at 100%', async () => {
    render(<PdfViewer url="test.pdf" courseId="course-1" />)
    await act(async () => { vi.runAllTimers() })
    expect(screen.getByTestId('zoom-level')).toHaveTextContent('100%')
  })

  it('increases zoom on + key', async () => {
    render(<PdfViewer url="test.pdf" courseId="course-1" />)
    await act(async () => { vi.runAllTimers() })
    fireEvent.keyDown(window, { key: '+' })
    expect(screen.getByTestId('zoom-level')).toHaveTextContent('110%')
  })

  it('decreases zoom on - key', async () => {
    render(<PdfViewer url="test.pdf" courseId="course-1" />)
    await act(async () => { vi.runAllTimers() })
    fireEvent.keyDown(window, { key: '-' })
    expect(screen.getByTestId('zoom-level')).toHaveTextContent('90%')
  })

  it('zoom does not exceed 200%', async () => {
    render(<PdfViewer url="test.pdf" courseId="course-1" />)
    await act(async () => { vi.runAllTimers() })
    for (let i = 0; i < 20; i++) fireEvent.keyDown(window, { key: '+' })
    expect(screen.getByTestId('zoom-level')).toHaveTextContent('200%')
  })

  it('zoom does not go below 50%', async () => {
    render(<PdfViewer url="test.pdf" courseId="course-1" />)
    await act(async () => { vi.runAllTimers() })
    for (let i = 0; i < 20; i++) fireEvent.keyDown(window, { key: '-' })
    expect(screen.getByTestId('zoom-level')).toHaveTextContent('50%')
  })
})

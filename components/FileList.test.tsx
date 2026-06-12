import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/actions/files', () => ({
  deleteFile: vi.fn(),
  renameFile: vi.fn().mockResolvedValue(undefined),
  reorderFiles: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, className }: any) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

vi.mock('next/dynamic', () => ({
  default: () => {
    const Comp = () => <div data-testid="pdf-thumbnail" />
    Comp.displayName = 'DynamicPdfThumbnail'
    return Comp
  },
}))

vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>()
  return {
    ...actual,
    DndContext: ({ children }: any) => <div>{children}</div>,
    useSensor: vi.fn(),
    useSensors: vi.fn(() => []),
    PointerSensor: vi.fn(),
    closestCenter: vi.fn(),
  }
})

vi.mock('@dnd-kit/sortable', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/sortable')>()
  return {
    ...actual,
    SortableContext: ({ children }: any) => <div>{children}</div>,
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: null,
      isDragging: false,
    }),
    arrayMove: actual.arrayMove,
    verticalListSortingStrategy: vi.fn(),
  }
})

import FileList from './FileList'
import { renameFile } from '@/actions/files'

const mockFiles = [
  {
    id: 'file-1',
    course_id: 'course-1',
    filename: 'บทที่ 1.pdf',
    storage_path: 'course-1/file1.pdf',
    uploaded_by: 'user-1',
    created_at: '2026-06-01T00:00:00Z',
    display_order: 0,
  },
  {
    id: 'file-2',
    course_id: 'course-1',
    filename: 'บทที่ 2.pdf',
    storage_path: 'course-1/file2.pdf',
    uploaded_by: 'user-2',
    created_at: '2026-06-02T00:00:00Z',
    display_order: 1,
  },
]

const mockSignedUrls = {
  'file-1': 'https://example.com/signed/file1.pdf',
  'file-2': 'https://example.com/signed/file2.pdf',
}

describe('FileList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders filenames', () => {
    render(
      <FileList
        files={mockFiles}
        signedUrls={mockSignedUrls}
        currentUserId="user-1"
        isAdmin={false}
      />
    )
    expect(screen.getByText('บทที่ 1.pdf')).toBeInTheDocument()
    expect(screen.getByText('บทที่ 2.pdf')).toBeInTheDocument()
  })

  it('shows empty state when no files', () => {
    render(
      <FileList
        files={[]}
        signedUrls={{}}
        currentUserId="user-1"
        isAdmin={false}
      />
    )
    expect(screen.getByText('ยังไม่มีไฟล์ในวิชานี้')).toBeInTheDocument()
  })

  it('enters edit mode when filename is clicked', () => {
    render(
      <FileList
        files={mockFiles}
        signedUrls={mockSignedUrls}
        currentUserId="user-1"
        isAdmin={false}
      />
    )
    fireEvent.click(screen.getByText('บทที่ 1.pdf'))
    expect(screen.getByDisplayValue('บทที่ 1.pdf')).toBeInTheDocument()
  })

  it('cancels edit on Escape key', () => {
    render(
      <FileList
        files={mockFiles}
        signedUrls={mockSignedUrls}
        currentUserId="user-1"
        isAdmin={false}
      />
    )
    fireEvent.click(screen.getByText('บทที่ 1.pdf'))
    const input = screen.getByDisplayValue('บทที่ 1.pdf')
    fireEvent.change(input, { target: { value: 'แก้ไขใหม่.pdf' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.getByText('บทที่ 1.pdf')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('แก้ไขใหม่.pdf')).not.toBeInTheDocument()
  })

  it('calls renameFile on Enter with new name', async () => {
    render(
      <FileList
        files={mockFiles}
        signedUrls={mockSignedUrls}
        currentUserId="user-1"
        isAdmin={false}
      />
    )
    fireEvent.click(screen.getByText('บทที่ 1.pdf'))
    const input = screen.getByDisplayValue('บทที่ 1.pdf')
    fireEvent.change(input, { target: { value: 'บทที่ 1 ใหม่.pdf' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => {
      expect(renameFile).toHaveBeenCalledWith('file-1', 'บทที่ 1 ใหม่.pdf', 'course-1')
    })
  })

  it('does not call renameFile if name unchanged', async () => {
    render(
      <FileList
        files={mockFiles}
        signedUrls={mockSignedUrls}
        currentUserId="user-1"
        isAdmin={false}
      />
    )
    fireEvent.click(screen.getByText('บทที่ 1.pdf'))
    const input = screen.getByDisplayValue('บทที่ 1.pdf')
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => {
      expect(renameFile).not.toHaveBeenCalled()
    })
  })

  it('shows delete button only for own files when not admin', () => {
    render(
      <FileList
        files={mockFiles}
        signedUrls={mockSignedUrls}
        currentUserId="user-1"
        isAdmin={false}
      />
    )
    const deleteButtons = screen.getAllByText('ลบ')
    expect(deleteButtons).toHaveLength(1)
  })

  it('shows delete button for all files when admin', () => {
    render(
      <FileList
        files={mockFiles}
        signedUrls={mockSignedUrls}
        currentUserId="user-1"
        isAdmin={true}
      />
    )
    const deleteButtons = screen.getAllByText('ลบ')
    expect(deleteButtons).toHaveLength(2)
  })
})

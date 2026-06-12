# Teaching Website v2 — Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add PDF thumbnails in FileList, zoom + page-jump in Presenter, and rename + drag-to-reorder file management.

**Architecture:** Three independent UI improvements. DB gains one `display_order` column. Server actions gain `renameFile` and `reorderFiles`. FileList is rewritten with `@dnd-kit/sortable` and a new `PdfThumbnail` sub-component. `PdfViewer` gains zoom and page-jump controls. `CoursePage` generates signed URLs server-side and passes them down.

**Tech Stack:** Next.js 16 / React 19 / TypeScript / Tailwind CSS v4 / Supabase / react-pdf v10 / @dnd-kit/core + sortable + utilities / Vitest + @testing-library/react

---

## File Map

| File | Change |
|------|--------|
| `supabase/migrations/003_display_order.sql` | New — adds `display_order` column |
| `lib/types.ts` | Add `display_order: number` to `CourseFile` |
| `actions/files.ts` | Add `renameFile`, `reorderFiles` |
| `components/PdfThumbnail.tsx` | New — renders page-1 thumbnail via react-pdf |
| `components/PdfThumbnail.test.tsx` | New — tests for PdfThumbnail |
| `components/PdfViewer.tsx` | Add zoom state + zoom buttons + page-jump input |
| `components/PdfViewer.test.tsx` | Update page-display assertions; add zoom tests |
| `app/(app)/courses/[id]/page.tsx` | Generate signedUrls; order files by display_order |
| `components/FileList.tsx` | Rewrite: add thumbnail, rename, drag-to-reorder |
| `components/FileList.test.tsx` | New — tests for rename UI |

---

## Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/003_display_order.sql`

- [ ] **Step 1: Write migration file**

```sql
ALTER TABLE public.course_files
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;
```

Save to `supabase/migrations/003_display_order.sql`.

- [ ] **Step 2: Run migration via Supabase dashboard**

Go to https://jcysnzbledwvrlnmzzga.supabase.co → SQL Editor → paste the SQL above → Run.

- [ ] **Step 3: Verify column exists**

In Supabase dashboard → Table Editor → `course_files` → confirm `display_order` column appears.

- [ ] **Step 4: Commit migration file**

```bash
git add supabase/migrations/003_display_order.sql
git commit -m "feat: add display_order column to course_files"
```

---

## Task 2: Install @dnd-kit packages + update CourseFile type

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Install packages**

```bash
cd D:\teaching-website
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Expected: packages added to `node_modules`, `package.json` dependencies updated.

- [ ] **Step 2: Update CourseFile type**

In `lib/types.ts`, replace the `CourseFile` interface:

```typescript
export interface CourseFile {
  id: string
  course_id: string
  filename: string
  storage_path: string
  uploaded_by: string | null
  created_at: string
  display_order: number
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors (or only pre-existing ones unrelated to this change).

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts package.json package-lock.json
git commit -m "feat: add display_order to CourseFile type; install @dnd-kit"
```

---

## Task 3: Add renameFile and reorderFiles server actions

**Files:**
- Modify: `actions/files.ts`

- [ ] **Step 1: Add renameFile and reorderFiles to actions/files.ts**

Append to the end of `actions/files.ts` (keep all existing functions):

```typescript
export async function renameFile(fileId: string, newName: string, courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const trimmed = newName.trim()
  if (!trimmed) throw new Error('ชื่อไม่ถูกต้อง')

  const { error } = await supabase
    .from('course_files')
    .update({ filename: trimmed })
    .eq('id', fileId)

  if (error) throw new Error(error.message)
  revalidatePath(`/courses/${courseId}`)
}

export async function reorderFiles(orderedIds: string[], courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('course_files').update({ display_order: index }).eq('id', id)
    )
  )

  revalidatePath(`/courses/${courseId}`)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add actions/files.ts
git commit -m "feat: add renameFile and reorderFiles server actions"
```

---

## Task 4: PdfThumbnail component

**Files:**
- Create: `components/PdfThumbnail.tsx`
- Create: `components/PdfThumbnail.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/PdfThumbnail.test.tsx`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd D:\teaching-website
npx vitest run components/PdfThumbnail.test.tsx
```

Expected: FAIL — `PdfThumbnail` module not found.

- [ ] **Step 3: Create PdfThumbnail component**

Create `components/PdfThumbnail.tsx`:

```typescript
'use client'

import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface Props {
  url: string
}

export default function PdfThumbnail({ url }: Props) {
  return (
    <div className="w-20 h-[100px] bg-gray-100 rounded overflow-hidden shrink-0 flex items-center justify-center">
      <Document
        file={url}
        loading={<div className="w-full h-full bg-gray-200 animate-pulse" />}
        error={<div className="text-xs text-gray-400 text-center px-1">—</div>}
      >
        <Page
          pageNumber={1}
          width={80}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run components/PdfThumbnail.test.tsx
```

Expected: PASS — 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/PdfThumbnail.tsx components/PdfThumbnail.test.tsx
git commit -m "feat: add PdfThumbnail component"
```

---

## Task 5: Update PdfViewer — zoom + page jump

**Files:**
- Modify: `components/PdfViewer.tsx`
- Modify: `components/PdfViewer.test.tsx`

- [ ] **Step 1: Update PdfViewer.test.tsx first (tests first, then implementation)**

Replace the entire contents of `components/PdfViewer.test.tsx`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run components/PdfViewer.test.tsx
```

Expected: several FAILs on the new zoom and page-input assertions.

- [ ] **Step 3: Rewrite PdfViewer.tsx with zoom + page jump**

Replace the entire contents of `components/PdfViewer.tsx`:

```typescript
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import Link from 'next/link'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface Props {
  url: string
  courseId: string
}

export default function PdfViewer({ url, courseId }: Props) {
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [baseWidth, setBaseWidth] = useState(800)

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setBaseWidth(Math.min(containerRef.current.clientWidth * 0.95, 1200))
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const pageWidth = baseWidth * zoom / 100

  const goNext = useCallback(() => {
    setCurrentPage(p => Math.min(p + 1, numPages))
  }, [numPages])

  const goPrev = useCallback(() => {
    setCurrentPage(p => Math.max(p - 1, 1))
  }, [])

  const zoomIn = useCallback(() => setZoom(z => Math.min(z + 10, 200)), [])
  const zoomOut = useCallback(() => setZoom(z => Math.max(z - 10, 50)), [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
      if (e.key === 'f' || e.key === 'F') toggleFullscreen()
      if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomIn() }
      if (e.key === '-') { e.preventDefault(); zoomOut() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev, toggleFullscreen, zoomIn, zoomOut])

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <div className="flex items-center justify-between px-6 py-3 bg-gray-800 text-white shrink-0 gap-4">
        <Link href={`/courses/${courseId}`} className="text-sm hover:underline text-gray-300 shrink-0">
          ← ออกจากการสอน
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">หน้า</span>
          <input
            type="number"
            min={1}
            max={numPages || 1}
            value={currentPage}
            onChange={e => {
              const v = parseInt(e.target.value)
              if (!isNaN(v) && v >= 1 && v <= numPages) setCurrentPage(v)
            }}
            onFocus={e => e.currentTarget.select()}
            className="w-14 text-center bg-gray-700 text-white rounded text-sm border border-gray-600 py-0.5 focus:outline-none focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-sm text-gray-300">/ {numPages || '-'}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={zoomOut}
            disabled={zoom <= 50}
            className="w-7 h-7 flex items-center justify-center bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30 text-sm font-bold"
            aria-label="Zoom out"
          >
            −
          </button>
          <span data-testid="zoom-level" className="text-sm font-mono w-12 text-center">
            {zoom}%
          </span>
          <button
            onClick={zoomIn}
            disabled={zoom >= 200}
            className="w-7 h-7 flex items-center justify-center bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30 text-sm font-bold"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            onClick={toggleFullscreen}
            className="text-sm px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 ml-2"
          >
            {isFullscreen ? 'ออกเต็มจอ' : '⛶ เต็มจอ (F)'}
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-auto py-4">
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<p className="text-gray-400 text-lg">กำลังโหลด PDF...</p>}
          error={<p className="text-red-400 text-lg">โหลด PDF ไม่สำเร็จ กรุณาลองใหม่</p>}
        >
          <Page
            pageNumber={currentPage}
            width={pageWidth}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>

      <div className="flex items-center justify-center gap-6 py-4 bg-gray-800 shrink-0">
        <button
          onClick={goPrev}
          disabled={currentPage <= 1}
          className="px-6 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-30 hover:bg-gray-600 disabled:cursor-not-allowed"
        >
          ← ย้อนกลับ
        </button>
        <button
          onClick={goNext}
          disabled={currentPage >= numPages}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-30 hover:bg-blue-500 disabled:cursor-not-allowed"
        >
          ถัดไป →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run components/PdfViewer.test.tsx
```

Expected: all 14 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/PdfViewer.tsx components/PdfViewer.test.tsx
git commit -m "feat: add zoom and page-jump to PdfViewer"
```

---

## Task 6: Update CoursePage + rewrite FileList

**Files:**
- Modify: `app/(app)/courses/[id]/page.tsx`
- Modify: `components/FileList.tsx`
- Create: `components/FileList.test.tsx`

- [ ] **Step 1: Write FileList tests first**

Create `components/FileList.test.tsx`:

```typescript
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
  default: (fn: any) => {
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run components/FileList.test.tsx
```

Expected: FAILs — `FileList` missing `signedUrls` prop, no rename UI.

- [ ] **Step 3: Rewrite FileList.tsx**

Replace the entire contents of `components/FileList.tsx`:

```typescript
'use client'

import { useState, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { deleteFile, renameFile, reorderFiles } from '@/actions/files'
import type { CourseFile } from '@/lib/types'

const PdfThumbnail = dynamic(() => import('./PdfThumbnail'), { ssr: false })

interface RowProps {
  file: CourseFile
  signedUrl: string
  currentUserId: string
  isAdmin: boolean
}

function SortableFileRow({ file, signedUrl, currentUserId, isAdmin }: RowProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(file.filename)
  const inputRef = useRef<HTMLInputElement>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: file.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const canDelete = isAdmin || file.uploaded_by === currentUserId

  const commitRename = async () => {
    const trimmed = editValue.trim()
    if (!trimmed || trimmed === file.filename) {
      setEditValue(file.filename)
      setEditing(false)
      return
    }
    await renameFile(file.id, trimmed, file.course_id)
    setEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-shadow"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0 touch-none text-lg select-none"
        aria-label="Drag to reorder"
      >
        ⠿
      </button>

      {signedUrl && <PdfThumbnail url={signedUrl} />}

      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); commitRename() }
              if (e.key === 'Escape') { setEditValue(file.filename); setEditing(false) }
            }}
            className="w-full border border-blue-400 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <p
            className="font-medium text-gray-800 truncate cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => { setEditing(true); setEditValue(file.filename) }}
            title="คลิกเพื่อแก้ไขชื่อ"
          >
            {file.filename}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date(file.created_at).toLocaleDateString('th-TH')}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-2">
        <Link
          href={`/present/${file.id}`}
          className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
        >
          เริ่มสอน
        </Link>
        {canDelete && (
          <form action={deleteFile.bind(null, file.id, file.storage_path, file.course_id)}>
            <button
              type="submit"
              className="text-sm text-red-500 hover:text-red-700 transition-colors"
              onClick={e => { if (!confirm('ลบไฟล์นี้?')) e.preventDefault() }}
            >
              ลบ
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

interface Props {
  files: CourseFile[]
  signedUrls: Record<string, string>
  currentUserId: string
  isAdmin: boolean
}

export default function FileList({ files: initialFiles, signedUrls, currentUserId, isAdmin }: Props) {
  const [files, setFiles] = useState(initialFiles)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  if (files.length === 0) {
    return <p className="text-gray-500 text-sm">ยังไม่มีไฟล์ในวิชานี้</p>
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = files.findIndex(f => f.id === active.id)
    const newIndex = files.findIndex(f => f.id === over.id)
    const reordered = arrayMove(files, oldIndex, newIndex)
    setFiles(reordered)
    await reorderFiles(reordered.map(f => f.id), reordered[0].course_id)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={files.map(f => f.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {files.map(file => (
            <SortableFileRow
              key={file.id}
              file={file}
              signedUrl={signedUrls[file.id] ?? ''}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
```

- [ ] **Step 4: Update CoursePage to generate signed URLs + order by display_order**

Replace the entire contents of `app/(app)/courses/[id]/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FileUpload from '@/components/FileUpload'
import FileList from '@/components/FileList'
import { getSignedUrl } from '@/actions/files'
import type { Course, CourseFile } from '@/lib/types'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CoursePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const [{ data: course }, { data: files }, { data: profile }] = await Promise.all([
    supabase.from('courses').select('*').eq('id', id).single(),
    supabase
      .from('course_files')
      .select('*')
      .eq('course_id', id)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false }),
    supabase.from('users').select('role').eq('id', authUser!.id).single(),
  ])

  if (!course) notFound()

  const isAdmin = profile?.role === 'admin'

  const signedUrlEntries = await Promise.all(
    ((files as CourseFile[]) ?? []).map(async file => [
      file.id,
      await getSignedUrl(file.storage_path),
    ])
  )
  const signedUrls = Object.fromEntries(
    signedUrlEntries.filter(([, url]) => url !== null)
  ) as Record<string, string>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:underline">วิชาของฉัน</Link>
        <span>/</span>
        <span className="text-gray-800">{(course as Course).name}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-800">{(course as Course).name}</h1>
        {(course as Course).description && (
          <p className="text-gray-500 mt-1">{(course as Course).description}</p>
        )}
      </div>

      <section className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-600 mb-3">อัปโหลดไฟล์ PDF</h2>
        <FileUpload courseId={id} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">ไฟล์การสอน</h2>
        <FileList
          files={(files as CourseFile[]) ?? []}
          signedUrls={signedUrls}
          currentUserId={authUser!.id}
          isAdmin={isAdmin}
        />
      </section>
    </div>
  )
}
```

- [ ] **Step 5: Run all tests**

```bash
npx vitest run
```

Expected: all tests PASS (PdfViewer + PdfThumbnail + FileList).

- [ ] **Step 6: Commit**

```bash
git add components/FileList.tsx components/FileList.test.tsx app/(app)/courses/[id]/page.tsx
git commit -m "feat: rewrite FileList with thumbnail, rename, drag-to-reorder; update CoursePage"
```

---

## Task 7: Build verification + full test run

- [ ] **Step 1: Run the full test suite**

```bash
cd D:\teaching-website
npx vitest run
```

Expected: all tests PASS with 0 failures.

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: build succeeds with no errors. (Warnings about `<img>` tags or bundle size are acceptable.)

- [ ] **Step 4: Final commit if any build fixes were needed**

```bash
git add -A
git commit -m "fix: resolve build issues from v2 improvements"
```

Only run this step if Step 3 required changes.

---

## Task 8: Deploy to Vercel

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Verify Vercel auto-deploys**

Go to https://vercel.com/dashboard (account: `ipfu`) → confirm deployment triggered and passes.

- [ ] **Step 3: Smoke test on production**

Open https://teaching-website-seven.vercel.app and verify:
1. Course page shows PDF thumbnails next to each file
2. Filenames are clickable → shows inline edit input
3. Drag handle (⠿) appears on each file row
4. Present page shows zoom −/+ buttons and page number input
5. Typing a page number in the input jumps to that slide
6. `+`/`-` keys change the zoom percentage displayed

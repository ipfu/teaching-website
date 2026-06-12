# Teaching Website v2 — Improvements Design

**Date:** 2026-06-12  
**Status:** Approved (user: "พร้อมกันไปเลย" + goal directive)

---

## Scope

Three targeted improvements to the live teaching website:

1. PDF Thumbnails in FileList
2. Presenter: Page Jump + Zoom
3. File Management: Rename + Reorder

---

## Feature 1: PDF Thumbnails in FileList

**Problem:** Teachers can't tell which PDF is which from filenames alone.

**Solution:** Render page 1 of each PDF as a small thumbnail (80×100px) inside each FileList row.

**Architecture:**
- `CoursePage` (server component) generates signed URLs for all files via existing `getSignedUrl` action, passes `signedUrls: Record<string, string>` to `FileList`
- `FileList` renders a `<PdfThumbnail url={signedUrls[file.id]} />` client subcomponent per file
- `PdfThumbnail` uses `react-pdf` `<Document>` + `<Page pageNumber={1} width={80}>` with `renderTextLayer={false}` and `renderAnnotationLayer={false}`
- Shows a grey placeholder skeleton while loading

**No backend changes needed.** Uses existing signed URL infrastructure.

---

## Feature 2: Presenter — Page Jump + Zoom

**Problem:** Teachers can only go prev/next; can't jump to a specific slide or zoom in.

**Solution:** Add page jump input and zoom controls to `PdfViewer`.

**Architecture:**
- Add `zoom` state (number, default 100, range 50–200, step 10)
- `pageWidth = baseWidth * zoom / 100`
- Add zoom buttons: `−` and `+` in the top bar (next to fullscreen button)
- Add page jump: replace the `หน้า X / Y` text with an `<input type="number">` that submits on Enter/blur, clamped to [1, numPages]
- Keyboard: `+`/`=` for zoom in, `-` for zoom out (in addition to existing arrow/space/F)

**Changes only to `PdfViewer.tsx` — no DB or action changes.**

---

## Feature 3: File Management — Rename + Reorder

**Problem:** Teachers can't fix typos in filenames or reorder files to match lesson sequence.

### 3a — Rename

- Click filename → inline `<input>` appears pre-filled with current name
- Press Enter or blur → call `renameFile(fileId, newName)` server action
- Press Escape → cancel edit, restore original name
- New server action `renameFile` in `actions/files.ts`: updates `filename` in `course_files`, calls `revalidatePath`

### 3b — Reorder

- Drag handle (⠿ icon) on left of each FileList row
- Use `@dnd-kit/core` + `@dnd-kit/sortable` for drag-and-drop
- On drop: call `reorderFiles(courseId, orderedIds[])` server action
- Server action updates `display_order` column for each file
- `CoursePage` fetches files ordered by `display_order ASC, created_at DESC`

**DB migration required:**
```sql
ALTER TABLE course_files ADD COLUMN display_order integer NOT NULL DEFAULT 0;
```

Run via Supabase dashboard SQL editor.

---

## Data Flow Changes

```
CoursePage (server)
  ├── fetch files ordered by display_order
  ├── generate signedUrls for all files
  └── pass { files, signedUrls, currentUserId, isAdmin } to FileList

FileList (client)
  ├── DndContext + SortableContext (reorder)
  ├── per file: PdfThumbnail (thumbnail)
  ├── per file: inline rename input
  └── drag handle + delete button
```

---

## Packages to Install

- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

---

## Files to Change

| File | Change |
|------|--------|
| `supabase/migrations/003_display_order.sql` | New migration |
| `actions/files.ts` | Add `renameFile`, `reorderFiles` |
| `app/(app)/courses/[id]/page.tsx` | Generate signedUrls, pass to FileList, order by display_order |
| `components/FileList.tsx` | Add thumbnail, rename, reorder |
| `components/PdfThumbnail.tsx` | New component |
| `components/PdfViewer.tsx` | Add zoom + page jump |

---

## Out of Scope

- Annotation/drawing on slides
- Folder support
- File quota display
- Thumbnail sidebar in presenter

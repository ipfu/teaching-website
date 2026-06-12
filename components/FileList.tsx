'use client'

import { useState, useRef, useEffect } from 'react'
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

  useEffect(() => {
    setFiles(initialFiles)
  }, [initialFiles])

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

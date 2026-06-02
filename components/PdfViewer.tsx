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
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [pageWidth, setPageWidth] = useState(800)

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setPageWidth(Math.min(containerRef.current.clientWidth * 0.95, 1200))
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const goNext = useCallback(() => {
    setCurrentPage(p => Math.min(p + 1, numPages))
  }, [numPages])

  const goPrev = useCallback(() => {
    setCurrentPage(p => Math.max(p - 1, 1))
  }, [])

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
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev, toggleFullscreen])

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <div className="flex items-center justify-between px-6 py-3 bg-gray-800 text-white shrink-0">
        <Link href={`/courses/${courseId}`} className="text-sm hover:underline text-gray-300">
          ← ออกจากการสอน
        </Link>
        <span className="text-sm font-mono">
          หน้า {numPages > 0 ? currentPage : '-'} / {numPages || '-'}
        </span>
        <button
          onClick={toggleFullscreen}
          className="text-sm px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
        >
          {isFullscreen ? 'ออกเต็มจอ' : '⛶ เต็มจอ (F)'}
        </button>
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

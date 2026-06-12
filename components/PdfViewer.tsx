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

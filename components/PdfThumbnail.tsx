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

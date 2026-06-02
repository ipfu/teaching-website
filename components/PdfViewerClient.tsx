'use client'

import dynamic from 'next/dynamic'

const PdfViewer = dynamic(() => import('@/components/PdfViewer'), { ssr: false })

interface Props {
  url: string
  courseId: string
}

export default function PdfViewerClient({ url, courseId }: Props) {
  return <PdfViewer url={url} courseId={courseId} />
}

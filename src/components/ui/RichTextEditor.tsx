import { useRef, useMemo, useCallback } from 'react'
import ReactQuill, { Quill } from 'react-quill'
import BlotFormatter from 'quill-blot-formatter'
import 'react-quill/dist/quill.snow.css'
import { uploadApi } from '@/api/upload.api'
import toast from 'react-hot-toast'

Quill.register('modules/blotFormatter', BlotFormatter)

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
  simple?: boolean
}

const FULL_FORMATS = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'align',
  'list', 'bullet', 'indent',
  'link', 'image', 'video',
  'blockquote', 'code-block',
]
const SIMPLE_FORMATS = ['bold', 'italic', 'underline', 'list', 'bullet', 'link', 'image']

export default function RichTextEditor({ value, onChange, placeholder, minHeight = 200, simple = false }: Props) {
  const quillRef = useRef<ReactQuill>(null)

  const imageHandler = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const toastId = toast.loading('Đang tải ảnh...')
      try {
        const res = await uploadApi.image(file)
        const url: string = res?.data?.url
        if (!url) throw new Error()
        const quill = quillRef.current?.getEditor()
        if (!quill) return
        const range = quill.getSelection(true)
        quill.insertEmbed(range.index, 'image', url)
        quill.setSelection(range.index + 1, 0)
        toast.success('Đã tải ảnh lên', { id: toastId })
      } catch {
        toast.error('Upload ảnh thất bại', { id: toastId })
      }
    }
    input.click()
  }, [])

  const fullModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [2, 3, 4, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        ['link', 'image', 'video'],
        ['blockquote', 'code-block'],
        ['clean'],
      ],
      handlers: { image: imageHandler },
    },
    blotFormatter: {},
  }), [imageHandler])

  const simpleModules = useMemo(() => ({
    toolbar: {
      container: [
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: { image: imageHandler },
    },
    blotFormatter: {},
  }), [imageHandler])

  return (
    <div className="rich-editor" style={{ '--editor-min-height': `${minHeight}px` } as React.CSSProperties}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={simple ? simpleModules : fullModules}
        formats={simple ? SIMPLE_FORMATS : FULL_FORMATS}
      />
    </div>
  )
}

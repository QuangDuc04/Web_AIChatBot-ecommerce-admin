import api from './axios'

export const uploadApi = {
  image: (file: File) => {
    const fd = new FormData()
    fd.append('image', file)
    return api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
  },
  images: (files: File[]) => {
    const fd = new FormData()
    files.forEach((f) => fd.append('images', f))
    return api.post('/upload/images', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
  },
  delete: (publicId: string) =>
    api.delete('/upload/image', { data: { publicId } }).then((r) => r.data),
}

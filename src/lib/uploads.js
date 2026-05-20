import { supabase, isSupabaseConfigured } from './supabaseClient'

const buildFilePath = (bucket, file, folder = 'products') => {
  const extension = file.name.includes('.') ? file.name.split('.').pop() : ''
  const safeName = file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

  const unique = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}`

  return `${folder}/${bucket}/${unique}-${safeName}${extension ? `.${extension}` : ''}`
}

export const uploadFileAndGetUrl = async ({ file, bucket, folder }) => {
  if (!file) return ''

  if (!isSupabaseConfigured || !supabase) {
    throw new Error('File uploads require Supabase configuration.')
  }

  const path = buildFilePath(bucket, file, folder)
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type || undefined })

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data?.publicUrl || ''
}

export const uploadFilesAndGetUrls = async ({ files, bucket, folder }) => {
  if (!files || files.length === 0) return []

  const fileList = Array.isArray(files) ? files : Array.from(files)
  const uploads = fileList.map((file) =>
    uploadFileAndGetUrl({ file, bucket, folder }),
  )

  const urls = await Promise.all(uploads)
  return urls.filter(Boolean)
}

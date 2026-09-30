import { getServiceClient } from './db.js'

const LOGO_BUCKET = 'tenant-logos'
const MAX_LOGO_BYTES = 2 * 1024 * 1024 // 2MB, generous for a small business logo

const DATA_URL_RE = /^data:(image\/(?:png|jpeg|jpg|webp|svg\+xml));base64,(.+)$/

// Uploads a browser-supplied data URL (from a <input type="file"> read via
// FileReader) to the public tenant-logos bucket and returns its public URL.
// Runs server-side with the service role key, same as every other tenant
// write in this file, so it never depends on a client-side storage policy.
export async function uploadTenantLogo(tenantId: string, dataUrl: string): Promise<string> {
  const match = DATA_URL_RE.exec(dataUrl)
  if (!match) throw new Error('Unsupported image type. Use PNG, JPEG, WEBP, or SVG.')
  const [, mime, base64] = match
  const buffer = Buffer.from(base64, 'base64')
  if (buffer.byteLength > MAX_LOGO_BYTES) throw new Error('Logo file is too large (2MB max).')

  const extension = mime === 'image/svg+xml' ? 'svg' : mime.split('/')[1]
  const path = `${tenantId}.${extension}`

  const client = getServiceClient()
  const { error } = await client.storage
    .from(LOGO_BUCKET)
    .upload(path, buffer, { contentType: mime, upsert: true })
  if (error) throw error

  const { data } = client.storage.from(LOGO_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

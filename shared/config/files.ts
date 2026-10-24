export const allowedMimeTypes: Record<string, { extensions: string[]; maxBytes: number }> = {
  'image/png': { extensions: ['png'], maxBytes: 5 * 1024 * 1024 },
  'image/jpeg': { extensions: ['jpg', 'jpeg'], maxBytes: 5 * 1024 * 1024 },
  'image/webp': { extensions: ['webp'], maxBytes: 5 * 1024 * 1024 },
  'image/avif': { extensions: ['avif'], maxBytes: 5 * 1024 * 1024 },
  'image/svg+xml': { extensions: ['svg'], maxBytes: 2 * 1024 * 1024 },
  'image/x-icon': { extensions: ['ico'], maxBytes: 1 * 1024 * 1024 },
  'application/pdf': { extensions: ['pdf'], maxBytes: 10 * 1024 * 1024 },
}

export const imageMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/svg+xml'])

export function isAllowedFile(mime: string): boolean {
  return mime in allowedMimeTypes
}

/** Offers the text as a file download in the browser. Replaceable so tests need no real download. */
export type DownloadFile = (fileName: string, text: string) => void

export function browserDownload(fileName: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

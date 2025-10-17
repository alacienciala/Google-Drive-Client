export default function useFile() {
  const downloadFileFromBlob = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return {
    downloadFileFromBlob,
  }
}

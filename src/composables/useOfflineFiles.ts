import useAuth from '@/composables/useAuth'
import useGoogleDrive, { type GoogleDriveFile } from '@/composables/useGoogleDrive'

interface OfflineFileData {
  id: string
  name: string
  mimeType: string
  size: string | undefined
  modifiedTime: string
  blob: Blob
  savedAt: number
}

const openDatabase = (name: string) => new Promise<IDBDatabase>(
  (resolve, reject) => {
    const request = indexedDB.open(name, 1)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' })
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error)
    }
  }
)

export default async function useOfflineFiles() {
  const auth = useAuth()
  const db = await openDatabase(`${auth.user.value?.id}_offline_files`)
  const { downloadFileAsBlob } = useGoogleDrive()

  const hasFile = (file: GoogleDriveFile): Promise<boolean> =>
    new Promise((resolve, reject) => {
      const request = db
        .transaction('files', 'readonly')
        .objectStore('files')
        .get(file.id)
      request.onsuccess = (event) => resolve(!!(event.target as IDBRequest).result)
      request.onerror = () => reject(request.error)
    })

  const getAllFiles = (): Promise<OfflineFileData[]> =>
    new Promise((resolve, reject) => {
      const request = db
        .transaction('files', 'readonly')
        .objectStore('files')
        .getAll()
      request.onsuccess = (event) => resolve((event.target as IDBRequest<OfflineFileData[]>).result || [])
      request.onerror = () => reject(request.error)
    })

  const getFile = (file: GoogleDriveFile): Promise<OfflineFileData | null> =>
    new Promise((resolve, reject) => {
      const request = db
        .transaction('files', 'readonly')
        .objectStore('files')
        .get(file.id)
      request.onsuccess = (event) => resolve((event.target as IDBRequest<OfflineFileData>).result || null)
      request.onerror = () => reject(request.error)
    })

  const addFile = (file: GoogleDriveFile, blob: Blob): Promise<void> =>
    new Promise((resolve, reject) => {
      const request = db
        .transaction('files', 'readwrite')
        .objectStore('files')
        .put({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          size: file.size,
          modifiedTime: file.modifiedTime,
          blob: blob,
          savedAt: Date.now(),
        } satisfies OfflineFileData)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

  const removeFile = (file: GoogleDriveFile): Promise<void> =>
    new Promise((resolve, reject) => {
      const request = db
        .transaction('files', 'readwrite')
        .objectStore('files')
        .delete(file.id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

  const clearAll = (): Promise<void> =>
    new Promise((resolve, reject) => {
      const request = db
        .transaction('files', 'readwrite')
        .objectStore('files')
        .clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

  const toggleFile = async (file: GoogleDriveFile): Promise<boolean> => {
    try {
      const exists = await hasFile(file)

      if (exists) {
        await removeFile(file)
        return false
      }

      const blob = await downloadFileAsBlob(file.id)
      if (!blob) throw new Error('Failed to download file')

      await addFile(file, blob)
      return true
    } catch (error) {
      console.error('Error toggling offline file:', error)
      throw error
    }
  }

  return {
    hasFile,
    getFile,
    addFile,
    removeFile,
    getAllFiles,
    clearAll,
    toggleFile,
  }
}

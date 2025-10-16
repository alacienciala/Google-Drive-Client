import useAuth from '@/composables/useAuth'
import axios from 'axios'
import { type ShallowRef } from 'vue'

export interface GoogleDriveFile {
  id: string
  name: string
  size: string | undefined
  mimeType: string
  iconLink: string | undefined
  webViewLink: string | undefined
  webContentLink: string | undefined
  modifiedTime: string
  parents: string[] | undefined
}

export interface GoogleDriveFileListResponse<F = GoogleDriveFile> {
  nextPageToken?: string
  files: F[]
}

export interface UploadGoogleFile {
  id: string
  file: File
  progress: ShallowRef<number>
  abortController: AbortController
  abort: () => void
}

export default function useGoogleDrive() {
  const auth = useAuth()

  const getFiles = async (
    directoryId: string|undefined = undefined
  ) => {
    const files: GoogleDriveFile[] = []

    const call = async (pageToken?: string) => {
      const response = await axios.get<GoogleDriveFileListResponse>(
        'https://www.googleapis.com/drive/v3/files',
        {
          headers: {
            Authorization: `${auth.user.value?.session.tokenType} ${auth.user.value?.session.accessToken}`,
          },
          params: {
            pageSize: 1000,
            pageToken: pageToken,
            q: directoryId
              ? `'${directoryId}' in parents and trashed = false`
              : "'root' in parents and trashed = false",
            fields: 'nextPageToken, files(id,name,size,mimeType,iconLink,webViewLink,webContentLink,modifiedTime)',
           orderBy: 'folder asc, modifiedTime desc, name',
          },
        }
      )
      return response.data
    }

    let pageToken: string | undefined = undefined

    do {
      const data = await call(pageToken)
      data.files.forEach(file => files.push(file))
      pageToken = data.nextPageToken
    } while (pageToken)

    return files
  }

  const getFile = async (fileId: string) => {
    const response = await axios.get<GoogleDriveFile>(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        headers: {
          Authorization: `${auth.user.value?.session.tokenType} ${auth.user.value?.session.accessToken}`,
        },
        params: {
          fields: 'id,name,size,mimeType,iconLink,webViewLink,webContentLink,modifiedTime,parents',
        }
      }
    )
    return response.data
  }

  const deleteFile = async (fileId: string) => {
    const response = await axios.delete(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        headers: {
          Authorization: `${auth.user.value?.session.tokenType} ${auth.user.value?.session.accessToken}`,
        }
      }
    )
    return response.status === 204
  }

  const renameFile = async (fileId: string, newName: string) => await axios.patch<GoogleDriveFile>(
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    {
      name: newName,
    },
    {
      headers: {
        Authorization: `${auth.user.value?.session.tokenType} ${auth.user.value?.session.accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )

  const duplicateFile = async (fileId: string, newName: string) => await axios.post<GoogleDriveFile>(
    `https://www.googleapis.com/drive/v3/files/${fileId}/copy`,
    {
      name: newName,
    },
    {
      headers: {
        Authorization: `${auth.user.value?.session.tokenType} ${auth.user.value?.session.accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )

  const moveFile = async (fileId: string, newParentId: string) => {
    const file = await getFile(fileId)
    const previousParents = file.parents ? file.parents.join(',') : ''
    await axios.patch<GoogleDriveFile>(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {},
      {
        headers: {
          Authorization: `${auth.user.value?.session.tokenType} ${auth.user.value?.session.accessToken}`,
        },
        params: {
          addParents: newParentId,
          removeParents: previousParents,
        },
      }
    )
  }

  const uploadFile = async (
    file: UploadGoogleFile,
    parentId: string | undefined,
    options: {
      onUploadProgress?: (percentage: number) => void
    } = {}
  ) => {
    const CHUNK_SIZE = 1 * 1024 * 1024

    let uploadUrl: string

    const metadataResponse = await axios.post(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
      {
        name: file.file.name,
        parents: parentId ? [parentId] : [],
        mimeType: file.file.type,
      },
      {
        headers: {
          Authorization: `${auth.user.value?.session.tokenType} ${auth.user.value?.session.accessToken}`,
          'Content-Type': 'application/json',
        },
        signal: file.abortController.signal,
      }
    )

    uploadUrl = metadataResponse.headers.location
    if (!uploadUrl) {
      throw new Error('Failed to get upload URL')
    }

    let currentByte = 0
    const totalBytes = file.file.size
    let uploadedFileId: string | undefined = undefined

    while (currentByte < totalBytes) {
      const endByte = Math.min(currentByte + CHUNK_SIZE, totalBytes)
      const chunk = file.file.slice(currentByte, endByte)

      const chunkResponse = await axios.put(
        uploadUrl,
        chunk,
        {
          headers: {
            Authorization: `${auth.user.value?.session.tokenType} ${auth.user.value?.session.accessToken}`,
            'Content-Range': `bytes ${currentByte}-${endByte - 1}/${totalBytes}`,
            'Content-Type': file.file.type,
          },
          signal: file.abortController.signal,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const chunkProgress = (progressEvent.loaded / progressEvent.total) * (endByte - currentByte)
              const percentage = Math.min(((currentByte + chunkProgress) / totalBytes) * 100, 100)
              options.onUploadProgress?.(percentage)
            }
          },
          validateStatus: (status) => (status >= 200 && status < 300) || status === 308,
        }
      )

      if (chunkResponse.status === 308) {
        const range = chunkResponse.headers.range
        if (range) {
          const match = range.match(/bytes=0-(\d+)/)
          if (match && match[1]) {
            currentByte = parseInt(match[1], 10) + 1
          } else {
            throw new Error('Invalid Range header')
          }
        } else {
          throw new Error('Missing Range header')
        }
      } else if (chunkResponse.status === 200 || chunkResponse.status === 201) {
        uploadedFileId = chunkResponse.data.id
        break
      } else {
        throw new Error('Upload failed')
      }
    }

    return getFile(uploadedFileId!)
  }

  const isDirectory = (file: GoogleDriveFile) => {
    return file.mimeType === 'application/vnd.google-apps.folder'
  }

  return {
    getFiles,
    getFile,
    deleteFile,
    renameFile,
    duplicateFile,
    moveFile,
    uploadFile,
    isDirectory,
  }
}

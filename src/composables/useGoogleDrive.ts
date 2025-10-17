import axios, { type AxiosRequestConfig } from 'axios'
import { type ShallowRef } from 'vue'
import JSZip from 'jszip'
import useAuth from '@/composables/useAuth'
import useFile from '@/composables/useFile'

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
  const { downloadFileFromBlob } = useFile()

  const getEntities = async (
    query: string | undefined = undefined,
    options: AxiosRequestConfig = {},
  ) => {
    const files: GoogleDriveFile[] = []

    const call = async (pageToken?: string) => {
      const response = await axios.get<GoogleDriveFileListResponse>(
        'https://www.googleapis.com/drive/v3/files',
        Object.assign({}, options, {
          headers: {
            Authorization: `${auth.user.value?.session.tokenType} ${auth.user.value?.session.accessToken}`,
          },
          params: {
            pageSize: 1000,
            pageToken: pageToken,
            q: query,
            fields: 'nextPageToken,files(id,name,size,mimeType,iconLink,webViewLink,webContentLink,modifiedTime,parents)',
            orderBy: 'folder asc, modifiedTime desc, name',
          },
        } satisfies AxiosRequestConfig)
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

  const getFiles = async (
    directoryId: string|undefined = undefined,
    options: AxiosRequestConfig = {},
  ) => {
    const query = directoryId
      ? `'${directoryId}' in parents and trashed = false`
      : "'root' in parents and trashed = false"

    return await getEntities(query, options)
  }

  const getDirectories = async (
    directoryId: string|undefined = undefined,
    parentId: string | undefined = undefined,
    options: AxiosRequestConfig = {}
  ) => {
    const dirs: GoogleDriveFile[] = []
    const query = `'${directoryId ?? 'root'}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    dirs.push(...await getEntities(query, options))
    if (parentId) {
      const parentDir = await getFile(parentId, options)
      dirs.unshift(parentDir)
    }
    return dirs
  }

  const getFile = async (
    fileId: string,
    options: AxiosRequestConfig = {}
  ) => {
    const response = await axios.get<GoogleDriveFile>(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      Object.assign({}, options, {
        headers: {
          Authorization: `${auth.user.value?.session.tokenType} ${auth.user.value?.session.accessToken}`,
        },
        params: {
          fields: 'id,name,size,mimeType,iconLink,webViewLink,webContentLink,modifiedTime,parents',
        }
      } satisfies AxiosRequestConfig)
    )
    return response.data
  }

  const deleteFile = async (
    fileId: string,
    options: AxiosRequestConfig = {},
  ) => {
    const response = await axios.delete(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      Object.assign({}, options, {
        headers: {
          Authorization: `${auth.user.value?.session.tokenType} ${auth.user.value?.session.accessToken}`,
        }
      } satisfies AxiosRequestConfig)
    )
    return response.status === 204
  }

  const renameFile = async (
    fileId: string,
    newName: string,
    options: AxiosRequestConfig = {},
  ) => await axios.patch<GoogleDriveFile>(
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    {
      name: newName,
    },
    Object.assign({}, options, {
      headers: {
        Authorization: `${auth.user.value?.session.tokenType} ${auth.user.value?.session.accessToken}`,
        'Content-Type': 'application/json',
      },
    } satisfies AxiosRequestConfig)
  )

  const duplicateFile = async (
    fileId: string,
    newName: string,
    options: AxiosRequestConfig = {},
  ) => await axios.post<GoogleDriveFile>(
    `https://www.googleapis.com/drive/v3/files/${fileId}/copy`,
    {
      name: newName,
    },
    Object.assign({}, options, {
      headers: {
        Authorization: `${auth.user.value?.session.tokenType} ${auth.user.value?.session.accessToken}`,
        'Content-Type': 'application/json',
      },
    } satisfies AxiosRequestConfig)
  )

  const moveFile = async (
    fileId: string,
    newParentId: string,
    options: AxiosRequestConfig = {},
  ) => {
    const file = await getFile(fileId)
    const previousParents = file.parents ? file.parents.join(',') : ''
    await axios.patch<GoogleDriveFile>(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {},
      Object.assign({}, options, {
        headers: {
          Authorization: `${auth.user.value?.session.tokenType} ${auth.user.value?.session.accessToken}`,
        },
        params: {
          addParents: newParentId,
          removeParents: previousParents,
        },
      } satisfies AxiosRequestConfig)
    )
  }

  const uploadFile = async (
    file: UploadGoogleFile,
    parentId: string | undefined,
    options: Omit<AxiosRequestConfig, 'onUploadProgress'> & {
      onUploadProgress?: (percentage: number) => void
    } = {},
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
        Object.assign({}, options, {
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
        } satisfies AxiosRequestConfig)
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

  const downloadFileAsBlob = async (
    fileId: string,
    options: AxiosRequestConfig = {},
  ) => {
    const response = await axios.get(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      Object.assign({}, options, {
        headers: {
          Authorization: `${auth.user.value?.session.tokenType} ${auth.user.value?.session.accessToken}`,
        },
        responseType: 'blob',
      } satisfies AxiosRequestConfig)
    )
    return response.data
  }

  const downloadFile = async (
    file: GoogleDriveFile
  ) => {
    const url = file.webContentLink
    window.open(url, '_blank')
  }


  const downloadDirectory = async (
    directoryId: string,
    options: AxiosRequestConfig = {},
  ) => {
    const filesToDownload: { file: GoogleDriveFile, path: string }[] = []

    const fetchFilesRecursively = async (parentId: string, currentPath: string) => {
      const files = await getFiles(parentId, options)
      for (const file of files) {
        if (isDirectory(file)) {
          await fetchFilesRecursively(file.id, `${currentPath}${file.name}/`)
        } else {
          filesToDownload.push({ file, path: `${currentPath}${file.name}` })
        }
      }
    }

    await fetchFilesRecursively(directoryId, '')

    const zip = new JSZip()
    for (const item of filesToDownload) {
      const blob = await downloadFileAsBlob(item.file.id)
      zip.file(item.path, blob)
    }

    downloadFileFromBlob(
      await zip.generateAsync({ type: 'blob' }),
      `directory_${directoryId}.zip`
    )
  }

  const download = async (entity: GoogleDriveFile) => isDirectory(entity)
    ? downloadDirectory(entity.id)
    : downloadFile(entity)

  const isDirectory = (file: GoogleDriveFile) => {
    return file.mimeType === 'application/vnd.google-apps.folder'
  }

  return {
    getFiles,
    getDirectories,
    getFile,
    deleteFile,
    renameFile,
    duplicateFile,
    moveFile,
    uploadFile,
    downloadFileAsBlob,
    download,
    isDirectory,
  }
}

import useAuth from '@/composables/useAuth'
import axios from 'axios'

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

export interface GoogleDriveFileListResponse {
  nextPageToken?: string
  files: GoogleDriveFile[]
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

  const isDirectory = (file: GoogleDriveFile) => {
    return file.mimeType === 'application/vnd.google-apps.folder'
  }

  return {
    getFiles,
    getFile,
    isDirectory,
  }
}

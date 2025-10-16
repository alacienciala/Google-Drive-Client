import useAuth from '@/composables/useAuth'
import axios from 'axios'

export interface GoogleDriveFile {
  id: string
  name: string
  size?: string
  mimeType: string
  iconLink?: string
  webViewLink?: string
  webContentLink?: string
  modifiedTime: string
}

export interface GoogleDriveFileListResponse {
  nextPageToken?: string
  files: GoogleDriveFile[]
}


export default async function useGoogleDrive() {
  const auth = useAuth()

  const getFiles = async () => {
    const files = new Set<GoogleDriveFile>([])

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
            q: "'root' in parents and trashed = false",
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
      data.files.forEach(file => files.add(file))
      pageToken = data.nextPageToken
    } while (pageToken)

    return Array.from(files)
  }

  const isDirectory = (file: GoogleDriveFile) => {
    return file.mimeType === 'application/vnd.google-apps.folder'
  }

  return {
    getFiles,
    isDirectory,
  }
}

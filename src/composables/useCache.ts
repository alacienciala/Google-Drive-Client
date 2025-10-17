import { useStorage } from '@vueuse/core'
import useAuth from '@/composables/useAuth'
import type { GoogleDriveFile } from '@/composables/useGoogleDrive'

export default function useCache() {
  const auth = useAuth()
  const storage = useStorage(
    `${auth.user.value!.id}-google-drive-cache`,
    {} as Record<string, GoogleDriveFile | GoogleDriveFile[]>,
    localStorage,
    {
      serializer: {
        read: (v: any) => v ? JSON.parse(v) : null,
        write: (v: any) => JSON.stringify(v),
      },
    },
  )

  return {
    getCache: <T>(key: string, defaultValue: T): T => {
      return storage.value[key] || defaultValue
    },
    setCache: <T>(key: string, value: T | undefined) => {
      if (value === undefined) return
      storage.value = { ...storage.value, [key]: value }
    },
    clearCache: (key: string) => {
      const { [key]: _, ...rest } = storage.value
      storage.value = rest
    },
    clearAllCache: () => [
      storage.value = {},
    ]
  }
}

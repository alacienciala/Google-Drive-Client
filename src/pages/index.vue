<script lang="ts" setup>
import { ref } from 'vue'
import useGoogleDrive, { type GoogleDriveFile } from '@/composables/useGoogleDrive'
import useCache from '@/composables/useCache'

const { getFiles } = useGoogleDrive()
const { getCache, setCache } = useCache()

const loading = ref(true)
const items = ref<GoogleDriveFile[]>(
  getCache<GoogleDriveFile[]>('root', [])
)

const reload = () => {
  loading.value = true
  getFiles().then((value) => {
    items.value = value
    setCache('root', value)
    loading.value = false
  })
}

reload()
</script>

<template>
  <drive-files-data-table
    :items="items"
    :loading="loading"
    @reload="reload"
  />
</template>

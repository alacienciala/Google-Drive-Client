<script lang="ts" setup>
import useGoogleDrive, { type GoogleDriveFile } from '@/composables/useGoogleDrive'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import useCache from '@/composables/useCache'

const { getFiles, getFile } = useGoogleDrive()
const { getCache, setCache } = useCache()

const route = useRoute<'/directories/[...path]'>()
const directoryId = computed(() => route.params.path)

const abortController = ref<AbortController | undefined>()
const loading = ref(true)
const file = ref<GoogleDriveFile | undefined>()
const items = ref<GoogleDriveFile[]>([])

const reload = async () => {
  if (abortController.value) {
    abortController.value.abort()
  }
  abortController.value = new AbortController()
  loading.value = true
  try {
    file.value = await getFile(directoryId.value, { signal: abortController.value?.signal })
    items.value = await getFiles(directoryId.value, { signal: abortController.value?.signal })
    setCache(directoryId.value, items.value)
    setCache(`file-${directoryId.value}`, file.value)
    abortController.value = undefined
    loading.value = false
  } catch (error) {
    if ((error as DOMException).name === 'AbortError') return
    console.error('Failed to load directory contents:', error)
  }
}

watch(
  directoryId,
  async () => {
    file.value = getCache<GoogleDriveFile | undefined>(`file-${directoryId.value}`, undefined)
    items.value = getCache<GoogleDriveFile[]>(directoryId.value, [])
    await reload()
  },
  { immediate: true }
)
</script>

<template>
  <drive-files-data-table
    :parent-id="file?.parents?.length ? file.parents[0] : undefined"
    :current-id="directoryId"
    :items="items"
    :loading="loading"
    @reload="reload"
  />
</template>

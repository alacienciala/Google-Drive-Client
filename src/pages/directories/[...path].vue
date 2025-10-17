<script lang="ts" setup>
import useGoogleDrive, { type GoogleDriveFile } from '@/composables/useGoogleDrive'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import useCache from '@/composables/useCache'

const { getFiles, getFile } = useGoogleDrive()
const { getCache, setCache } = useCache()

const route = useRoute<'/directories/[...path]'>()
const directoryId = computed(() => route.params.path)

const loading = ref(true)
const file = ref<GoogleDriveFile | undefined>()
const items = ref<GoogleDriveFile[]>([])

const reload = async () => {
  loading.value = true
  file.value = await getFile(directoryId.value)
  items.value = await getFiles(directoryId.value)
  setCache(directoryId.value, items.value)
  setCache(`file-${directoryId.value}`, file.value)
  loading.value = false
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

<script lang="ts" setup>
import useGoogleDrive, { type GoogleDriveFile } from '@/composables/useGoogleDrive'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const { getFiles, getFile } = useGoogleDrive()
const route = useRoute<'/directories/[...path]'>()
const directoryId = computed(() => route.params.path)

const loading = ref(true)
const file = ref<GoogleDriveFile | undefined>()
const items = ref<GoogleDriveFile[]>([])

const reload = async () => {
  loading.value = true
  file.value = await getFile(directoryId.value)
  items.value = await getFiles(directoryId.value)
  loading.value = false
}

watch(
  directoryId,
  async () => await reload(),
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

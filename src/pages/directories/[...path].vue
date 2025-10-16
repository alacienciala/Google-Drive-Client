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

watch(
  directoryId,
  async (value) => {
    loading.value = true
    file.value = await getFile(value)
    items.value = await getFiles(value)
    loading.value = false
  },
  { immediate: true }
)
</script>

<template>
  <drive-files-data-table
    :parent-id="file?.parents?.length ? file.parents[0] : undefined"
    :items="items"
    :loading="loading"
  />
</template>

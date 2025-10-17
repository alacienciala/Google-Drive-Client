<script lang="ts" setup>
import { ref } from 'vue'
import type { GoogleDriveFile } from '@/composables/useGoogleDrive'
import useOfflineFiles from '@/composables/useOfflineFiles'
import useFile from '@/composables/useFile'

const { file } = defineProps<{
  file: GoogleDriveFile
}>()

const {
  toggleFile: toggleOfflineFile,
  hasFile: hasOfflineFile,
  getFile: getOfflineFile,
} = await useOfflineFiles()

const { downloadFileFromBlob } = useFile()

const hasOffline = ref<boolean>(await hasOfflineFile(file))

const toggleOffline = async () => {
  await toggleOfflineFile(file)
  hasOffline.value = await hasOfflineFile(file)
}

const downloadOffline = async () => {
  if (!hasOffline.value) return
  const index = await getOfflineFile(file)
  if (!index?.blob) return
  downloadFileFromBlob(index?.blob, file.name)
}
</script>

<template>
  <slot
    v-bind="{
      hasOffline,
      toggleOffline,
      downloadOffline
    }"
  />
</template>

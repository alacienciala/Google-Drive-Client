<script lang="ts" setup>
import useGoogleDrive, { type GoogleDriveFile } from '@/composables/useGoogleDrive'
import { ref } from 'vue'

const { getFiles } = useGoogleDrive()

const loading = ref(true)
const items = ref<GoogleDriveFile[]>([])

getFiles().then((value) => {
  items.value = value
  loading.value = false
})
</script>

<template>
  <drive-files-data-table
    :items="items"
    :loading="loading"
  />
</template>

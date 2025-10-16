<script lang="ts" setup>
import useGoogleDrive, { type GoogleDriveFile } from '@/composables/useGoogleDrive'
import { ref } from 'vue'

const { getFiles } = useGoogleDrive()

const loading = ref(true)
const items = ref<GoogleDriveFile[]>([])

const reload = () => {
  loading.value = true
  getFiles().then((value) => {
    items.value = value
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

<script lang="ts" setup>
import useGoogleDrive, { type GoogleDriveFile } from '@/composables/useGoogleDrive'
import { ref } from 'vue'
import prettyBytes from 'pretty-bytes'
import dayjs from 'dayjs'

const { getFiles, isDirectory } = await useGoogleDrive()

const loading = ref(true)
const fileList = ref<GoogleDriveFile[]>([])
const selected = ref<GoogleDriveFile | null>(null)

getFiles().then((value) => {
  fileList.value = value
  loading.value = false
})

const handleRowDoubleClick = (value: GoogleDriveFile) => {
  if (isDirectory(value)) {
    // @todo
    return
  }
  const url = selected.value!.webViewLink || selected.value!.webContentLink

  if (url) {
    window.open(url, '_blank')
  }
}
</script>

<template>
  <v-container fluid>
    <v-data-table-server
      :style="{
        backgroundColor: 'transparent',
      }"
      :items="fileList"
      :items-length="fileList.length || 0"
      :loading="loading"
      item-value="id"
      :headers="[
        { title: 'Name', value: 'name' },
        { title: 'Modified Time', value: 'modifiedTime' },
        { title: 'Size', value: 'size' },
        // { title: '', value: 'actions', sortable: false }
      ]"
      :items-per-page="-1"
      hide-default-footer
      :row-props="(item) => {
        return {
          style: {
            backgroundColor: selected?.id === item.item.id ? 'rgba(var(--v-theme-surface), 1)' : 'transparent',
            transition: 'background-color 0.1s',
            userSelect: 'none',
          },
          onClick: () => {
            if (selected?.id === item.item.id) {
              handleRowDoubleClick(selected)
              return
            }
            selected = item.item
          }
        }
      }"
    >
      <template #item.name="{ item }">
        <div class="d-flex align-center ga-4">
          <v-img
            class="flex-grow-0"
            :src="item.iconLink"
            :width="18"
            cover
          />
          <div>{{ item.name }}</div>
        </div>
      </template>
      <template #item.modifiedTime="{ item }">
        {{ item.modifiedTime ? dayjs(item.modifiedTime).format('DD MMM YYYY') : '' }}
      </template>
      <template #item.size="{ item }">
        {{ item.size ? prettyBytes(Number(item.size)) : ''}}
      </template>
    </v-data-table-server>
  </v-container>
</template>

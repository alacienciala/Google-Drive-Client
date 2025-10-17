<script lang="ts" setup>
import useGoogleDrive, { type GoogleDriveFile, type UploadGoogleFile } from '@/composables/useGoogleDrive'
import { reactive, ref, shallowRef, useTemplateRef } from 'vue'
import prettyBytes from 'pretty-bytes'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'
import { onClickOutside, useDropZone } from '@vueuse/core'

const { uploadFile, isDirectory, download } = useGoogleDrive()
const router = useRouter()

const emit = defineEmits<{
  (e: 'reload'): void
}>()

const { currentId } = defineProps<{
  items: GoogleDriveFile[]
  loading: boolean
  currentId?: string
  parentId?: string
}>()

const uploadingItems = ref<UploadGoogleFile[]>([])
const tableElement = useTemplateRef<HTMLElement | null>('tableElement')
const selected = ref<GoogleDriveFile | null>(null)

const handleRowDoubleClick = (value: GoogleDriveFile) => {
  if (isDirectory(value)) {
    router.push({
      name: '/directories/[...path]',
      params: { path: value.id }
    })
    return
  }
  const url = selected.value!.webViewLink || selected.value!.webContentLink

  if (url) {
    window.open(url, '_blank')
  }
}

onClickOutside(
  tableElement,
  () => selected.value = null
)

const dialog = ref<{
  action: 'rename' | 'duplicate' |'move' | 'delete'
  file: GoogleDriveFile
} | undefined>(undefined)

const dropzone = useDropZone(document, {
  onDrop(files) {
    files?.forEach((file) => {
      const abortController = new AbortController()
      const item = {
        id: Math.random().toString(36).substring(2, 15),
        file: file,
        progress: shallowRef<number>(0),
        abortController,
        abort: () => {
          const index = uploadingItems.value.findIndex(i => i.id === item.id)
          if (index !== -1) {
            uploadingItems.value.splice(index, 1)
          }
          abortController.abort()
        }
      } satisfies UploadGoogleFile

      uploadingItems.value.push(item)

      uploadFile(item, currentId, {
        onUploadProgress(progress) {
          console.log('progress', progress)
          item.progress.value = progress
        }
      }).then(() => {
        const index = uploadingItems.value.findIndex(i => i.id === item.id)
        if (index !== -1) {
          uploadingItems.value.splice(index, 1)
        }
        emit('reload')
      })
    })
  },
  multiple: true,
  preventDefaultForUnhandled: true,
})
</script>

<template>
  <v-container fluid class="fill-height">
    <v-overlay
      :model-value="dropzone.isOverDropZone.value"
      eager
    />
    <v-data-table-server
      hover
      class="fill-height"
      ref="tableElement"
      :style="{
        backgroundColor: 'transparent',
      }"
      :items="items"
      :items-length="items.length || 0"
      item-value="id"
      :headers="[
        { title: 'Name', value: 'name' },
        { title: 'Modified Time', value: 'modifiedTime' },
        { title: 'Size', value: 'size' },
        { title: '', value: 'actions', sortable: false, align: 'end' }
      ]"
      :items-per-page="-1"
      hide-default-footer
      :row-props="(item) => {
        return {
          style: {
            backgroundColor: selected?.id === item.item.id ? 'rgba(var(--v-theme-on-surface), .12)' : 'transparent',
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
      <template #body.prepend>
        <tr>
          <td
            colspan="100%"
            :style="{ height: '4px', borderBottom: 'none' }"
            class="pa-0"
          >
            <v-progress-linear
              v-if="loading"
              height="4"
              color="primary"
              indeterminate
            />
          </td>
        </tr>
        <tr v-if="parentId">
          <td colspan="100%">
            <v-btn
              variant="text"
              prepend-icon="mdi-arrow-left"
              @click="$router.back()"
              size="small"
              :disabled="loading"
              text="Back"
            />
          </td>
        </tr>
      </template>
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
        {{ item.size ? prettyBytes(Number(item.size)) : '' }}
      </template>
      <template #item.actions="{ item }">
        <v-menu>
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              icon="mdi-dots-vertical"
              variant="text"
              size="small"
            />
          </template>
          <v-list>
            <v-list-item
              prepend-icon="mdi-open-in-new"
              title="Open"
              link
              @click="handleRowDoubleClick(item)"
            />
            <v-list-item
              prepend-icon="mdi-download-outline"
              title="Download"
              link
              @click="download(item)"
            />
            <v-list-item
              prepend-icon="mdi-rename-outline"
              title="Rename"
              link
              @click="dialog = { action: 'rename', file: item }"
            />
            <v-list-item
              v-if="!isDirectory(item)"
              prepend-icon="mdi-content-copy"
              title="Duplicate"
              link
              @click="dialog = { action: 'duplicate', file: item }"
            />
            <v-list-item
              prepend-icon="mdi-file-move-outline"
              title="Move"
              link
              @click="dialog = { action: 'move', file: item }"
            />
            <v-list-item
              prepend-icon="mdi-cloud-off-outline"
              title="Offline Access"
              link
            />
            <v-list-item
              prepend-icon="mdi-delete-outline"
              title="Delete"
              link
              @click="dialog = { action: 'delete', file: item }"
            />
          </v-list>
        </v-menu>
      </template>

      <template #body.append>
        <tr
          v-for="item in uploadingItems"
          :key="item.id"
        >
          <td>
            <div class="d-flex align-center ga-4">
              <v-progress-circular
                :model-value="item.progress"
                color="primary"
                :size="18"
                :width="4"
              />
              <div>{{ item.file.name }}</div>
            </div>
          </td>
          <td>
            {{ item.file.lastModified ? dayjs(item.file.lastModified).format('DD MMM YYYY') : '' }}
          </td>
          <td>
            {{ prettyBytes(item.file.size) }}
          </td>
          <td class="text-end">
            <v-btn
              icon="mdi-close"
              variant="text"
              size="small"
              @click="item.abort"
            />
          </td>
        </tr>
      </template>
    </v-data-table-server>

    <delete-file-dialog
      :value="dialog?.action === 'delete' ? dialog.file : undefined"
      @canceled="dialog = undefined"
      @deleted="() => {
        dialog = undefined
        emit('reload')
      }"
    />

    <duplicate-file-dialog
      :value="dialog?.action === 'duplicate' ? dialog.file : undefined"
      @canceled="dialog = undefined"
      @changed="() => {
        dialog = undefined
        emit('reload')
      }"
    />

    <move-file-dialog
      :parent-directory="parentId"
      :current-directory="currentId"
      :value="dialog?.action === 'move' ? dialog.file : undefined"
      @canceled="dialog = undefined"
      @changed="() => {
        dialog = undefined
        emit('reload')
      }"
    />

    <rename-file-dialog
      :value="dialog?.action === 'rename' ? dialog.file : undefined"
      @canceled="dialog = undefined"
      @changed="() => {
        dialog = undefined
        emit('reload')
      }"
    />
  </v-container>
</template>

<script lang="ts" setup>
import useGoogleDrive, { type GoogleDriveFile } from '@/composables/useGoogleDrive'
import { ref, toRef, watch } from 'vue'

const emit = defineEmits<{
  (e: 'canceled'): void
  (e: 'changed'): void
}>()

const props = defineProps<{
  value: GoogleDriveFile | undefined
  parentDirectory: string | undefined
  currentDirectory: string | undefined
}>()

const { moveFile, getDirectories } = useGoogleDrive()

const loading = ref<boolean>(false)

const selectedDirectory = ref<string | undefined>(undefined)
const lazyParentDirectory = ref<string | undefined>(undefined)
const lazyCurrentDirectory = ref<string | undefined>(undefined)
const directories = ref<GoogleDriveFile[]>([])

watch(
  toRef(props, 'value'),
  async (newValue) => {
    if (newValue) {
      lazyCurrentDirectory.value = props.currentDirectory
      lazyParentDirectory.value = props.parentDirectory
      selectedDirectory.value = props.currentDirectory
    } else {
      directories.value = []
      lazyCurrentDirectory.value = undefined
      lazyParentDirectory.value = undefined
    }
  },
  { immediate: true }
)

watch(
  () => [lazyCurrentDirectory.value, lazyParentDirectory.value, props.value],
  async() => {
    if (!props.value) return
    loading.value = true
    directories.value = await getDirectories(
      lazyCurrentDirectory.value,
      lazyParentDirectory.value,
    )
    loading.value = false
  },
  { immediate: true }
)

const handleSelect = (directory: GoogleDriveFile) => {
  if (directory.id !== selectedDirectory.value) {
    selectedDirectory.value = directory.id
    return
  }

  lazyCurrentDirectory.value = selectedDirectory.value
  lazyParentDirectory.value = directory.parents?.[0]
}

const handleMove = async () => {
  loading.value = true
  await moveFile(props.value!.id, selectedDirectory.value!)
  emit('changed')
  loading.value = false
}
</script>

<template>
  <v-dialog
    :model-value="!!value"
    @update:model-value="emit('canceled')"
    scrollable
  >
    <v-card :title='`Move "${value?.name}"`'>
      <v-list :style="{ userSelect: 'none' }">
        <v-list-item
          v-for="(directory, index) in directories"
          :key="directory.id"
          :active="selectedDirectory === directory.id"
          :prepend-icon="parentDirectory && index === 0 ? 'mdi-arrow-left' : 'mdi-folder'"
          :title="directory.name"
          @click="() => handleSelect(directory)"
          color="primary"
        />
      </v-list>
      <v-card-actions>
        <v-spacer />
        <v-btn
          @click="emit('canceled')"
          :disabled="loading"
          text="Cancel"
        />
        <v-btn
          :loading="loading"
          @click="handleMove"
          text="Move"
          :disabled="selectedDirectory === currentDirectory"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

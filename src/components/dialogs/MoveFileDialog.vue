<script lang="ts" setup>
import useGoogleDrive, { type GoogleDriveFile } from '@/composables/useGoogleDrive'
import { ref, watch } from 'vue'

const emit = defineEmits<{
  (e: 'canceled'): void
  (e: 'changed'): void
}>()

const { value } = defineProps<{
  value: GoogleDriveFile | undefined
}>()

const { moveFile } = useGoogleDrive()

const loading = ref<boolean>(false)

const handleMove = async () => {
  loading.value = true
  // await moveFile(value!.id)
  emit('changed')
  loading.value = false
}
</script>

<template>
  <v-dialog
    :model-value="!!value"
    @update:model-value="emit('canceled')"
  >
    <v-card title="Move File">
      <v-treeview
        :items="directories"
        item-value="id"
        item-title="name"
        activatable
      />
      <v-card-actions>
        <v-spacer />
        <v-btn
          @click="emit('canceled')"
          :disabled="loading"
          text="Cancel"
        />
        <v-btn
          color="red"
          :loading="loading"
          @click="handleMove"
          text="Delete"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import useGoogleDrive, { type GoogleDriveFile } from '@/composables/useGoogleDrive'
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'canceled'): void
  (e: 'deleted'): void
}>()

const { deleteFile } = useGoogleDrive()

const { value } = defineProps<{
  value: GoogleDriveFile | undefined
}>()

const loading = ref<boolean>(false)

const handleDelete = async () => {
  loading.value = true
  await deleteFile(value!.id)
  emit('deleted')
  loading.value = false
}
</script>

<template>
  <v-dialog
    :model-value="!!value"
    @update:model-value="emit('canceled')"
  >
    <v-card
      title="Delete File"
      subtitle="Are you sure you want to delete this file?"
    >
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
          @click="handleDelete"
          text="Delete"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

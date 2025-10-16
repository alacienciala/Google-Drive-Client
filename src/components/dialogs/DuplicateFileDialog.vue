<script lang="ts" setup>
import useGoogleDrive, { type GoogleDriveFile } from '@/composables/useGoogleDrive'
import { ref, watch } from 'vue'

const emit = defineEmits<{
  (e: 'canceled'): void
  (e: 'changed'): void
}>()

const { duplicateFile } = useGoogleDrive()

const { value } = defineProps<{
  value: GoogleDriveFile | undefined
}>()

const newName = ref<string>('')

watch(
  () => value,
  (val) => {
    newName.value = val?.name || ''
  }
)

const loading = ref<boolean>(false)

const handleDuplicate = async () => {
  loading.value = true
  await duplicateFile(value!.id, newName.value)
  emit('changed')
  loading.value = false
}
</script>

<template>
  <v-dialog
    :model-value="!!value"
    @update:model-value="emit('canceled')"
  >
    <v-confirm-edit>
      <template v-slot:default="{ actions }">
        <v-card
          title="Duplicate File"
          subtitle="Specify the name for the duplicate file"
        >
          <template v-slot:text>
            <v-text-field
              v-model="newName"
              :disabled="loading"
              hide-details="auto"
              @keyup.enter="handleDuplicate"
            ></v-text-field>
          </template>
          <template v-slot:actions>
            <v-spacer></v-spacer>
            <v-btn
              @click="emit('canceled')"
              :disabled="loading"
              text="Cancel"
            />
            <v-btn
              :loading="loading"
              @click="handleDuplicate"
              text="Duplicate"
            />
          </template>
        </v-card>
      </template>
    </v-confirm-edit>
  </v-dialog>
</template>

<script lang="ts" setup>
import useGoogleDrive, { type GoogleDriveFile } from '@/composables/useGoogleDrive'
import { ref, watch } from 'vue'

const emit = defineEmits<{
  (e: 'canceled'): void
  (e: 'changed'): void
}>()

const { renameFile } = useGoogleDrive()

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

const handleRename = async () => {
  loading.value = true
  await renameFile(value!.id, newName.value)
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
          title="Rename File"
          subtitle="Modify the file name"
        >
          <template v-slot:text>
            <v-text-field
              v-model="newName"
              :disabled="loading"
              hide-details="auto"
              @keyup.enter="handleRename"
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
              @click="handleRename"
              text="Change"
            />
          </template>
        </v-card>
      </template>
    </v-confirm-edit>
  </v-dialog>
</template>

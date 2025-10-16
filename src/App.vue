<script lang="ts" setup>
import { ref, watch } from 'vue'
import useAuth from '@/composables/useAuth'

const auth = useAuth()
const loading = ref<boolean>(true)

watch(
  auth.isAuthenticated,
  (value) => {
    loading.value = !value
  },
  { immediate: true }
)
</script>

<template>
  <v-app>
    <auth-provider />
    <v-main
      v-if="loading"
      class="d-flex align-center justify-center fill-height"
      fluid
    >
      <v-progress-circular
        indeterminate
        :size="64"
        :width="8"
      />
    </v-main>
    <v-main v-else>
      <suspense>
        <router-view />
      </suspense>
    </v-main>
  </v-app>
</template>

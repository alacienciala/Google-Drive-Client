<script lang="ts" setup>
import { ref, watch } from 'vue'
import useAuth from '@/composables/useAuth'
import useCache from '@/composables/useCache'

const auth = useAuth()
const loading = ref<boolean>(true)

const clearCache = () => {
  const { clearAllCache } = useCache()
  clearAllCache()
}

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
    <template v-else>
      <v-app-bar>
        <v-app-bar-title text="Drive Manager" />
        <v-spacer />
        <v-menu offset-y eager>
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              icon
            >
              <v-avatar v-if="auth.user.value?.avatar">
                <v-img
                  :src="auth.user.value.avatar"
                  :alt="`${auth.user.value?.firstName} ${auth.user.value?.lastName}`"
                  referrerpolicy="no-referrer"
                  cover
                  eager
                />
              </v-avatar>
              <v-icon v-else icon="mdi-account-circle"/>
            </v-btn>
          </template>
          <v-list v-if="auth.user.value">
            <v-list-item
              :title="`${auth.user.value.firstName} ${auth.user.value.lastName}`"
              :subtitle="auth.user.value.email"
            />
            <v-divider class="my-3" />
            <v-list-item
              prepend-icon="mdi-refresh"
              title="Clear Cache"
              @click="clearCache"
            />
            <v-list-item
              prepend-icon="mdi-logout"
              title="Logout"
              @click="auth.clearUser"
            />
          </v-list>
        </v-menu>
      </v-app-bar>
      <v-main>
        <suspense>
          <router-view />
        </suspense>
      </v-main>
    </template>
  </v-app>
</template>

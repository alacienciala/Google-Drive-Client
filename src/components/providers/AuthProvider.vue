<script setup lang="ts">
import { useTokenClient } from 'vue3-google-signin'
import { watch } from 'vue'
import useAuth from '@/composables/useAuth'

const auth = useAuth()

const fetchProfile = async (accessToken: string) => {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!response.ok) {
    throw new Error('Failed to fetch user profile')
  }
  return await response.json() as {
    email: string
    email_verified: boolean
    family_name: string
    given_name: string
    hd: string | null
    name: string
    picture: string
    sub: string
  }
}

const { isReady, login } = useTokenClient({
  onSuccess: async(response) => {
    const profile = await fetchProfile(response.access_token)
    auth.setUser({
      id: profile.sub,
      email: profile.email,
      firstName: profile.given_name,
      lastName: profile.family_name,
      avatar: profile.picture,
      session: {
        accessToken: response.access_token,
        expiresIn: Date.now() + Number(response.expires_in) * 1000,
        tokenType: response.token_type,
      }
    })
  },
  onError: (error) => {
    console.error('Login Failed:', error)
  },
  scope: [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/drive',
  ]
})

watch(
  isReady,
  (newVal) => {
    if (newVal && !auth.isAuthenticated.value) {
      login()
    }
  },
  { immediate: true }
)
</script>

<template>
  <slot />
</template>

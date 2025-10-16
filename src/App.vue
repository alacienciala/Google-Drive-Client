<template>
  <v-app>
    <v-main>
      <v-btn v-if="session.profile==null" @click="login">Login with Google to access Google Drive</v-btn>
      <div v-if="session.profile">
        Logged in as <strong>{{ session.profile }}</strong>
      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import {googleSdkLoaded} from "vue3-google-login";
import {useStorage} from "@vueuse/core";
import DriveFiles from "@/components/DriveFiles.vue";

const session = useStorage('session', { accessToken: '', profile: null }, sessionStorage)

const fetchProfile = async (accessToken: string) => {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!res.ok) throw new Error(`userinfo ${res.status}`)
  return res.json()
}

const login = () => {
  googleSdkLoaded((google) => {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'openid email profile https://www.googleapis.com/auth/drive',
      callback: async (resp) => {
        session.value.accessToken = resp.access_token
        session.value.profile = await fetchProfile(resp.access_token)
        console.log(session.value)
      }
    })
    tokenClient.requestAccessToken({ prompt: 'consent' })
  })
}
const listDrive = async () => {
  const res = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=1', {
    headers: { Authorization: `Bearer ${session.value.accessToken}` }
  })
  const data = await res.json()
  console.log(res.status, data)
  return data
}


</script>

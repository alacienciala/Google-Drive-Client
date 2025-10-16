import { computed } from "vue"
import { useStorage } from '@vueuse/core'

type User = {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar: string
  session: {
    accessToken: string
    expiresIn: number
    tokenType: string
  }
}

const isTokenExpired = (expiresIn: number) => {
  const expiryDate = new Date(expiresIn)
  return new Date() > expiryDate
}

export default function useAuth() {
  const user = useStorage<User | undefined>(
    'user_session',
    undefined,
    sessionStorage,
    {
      serializer: {
        read: (v: any) => v ? JSON.parse(v) : null,
        write: (v: any) => JSON.stringify(v),
      },
    },
  )

  const setUser = (newUser: User) => {
    user.value = newUser
  }

  const clearUser = () => user.value = undefined

  if (user.value && isTokenExpired(user.value.session.expiresIn)) {
    console.log('Token expired, clearing user')
    clearUser()
  }

  return {
    setUser,
    clearUser,
    isAuthenticated: computed(() => !!user.value),
    user: computed(() => user.value)
  }
}

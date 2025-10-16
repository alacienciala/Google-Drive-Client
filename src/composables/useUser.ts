import {computed, ref} from "vue";

type User = {
  email: string;
  firstName: string;
  lastName: string;
  sub: string;
}


const user = ref<User|undefined>();

export default function useUser() {
  const setUser = (newUser: User) => {
    user.value = newUser;
  }

  const clearUser = () => user.value = undefined

  return {
    setUser,
    clearUser,
    user: computed(() => user.value)
  }
}

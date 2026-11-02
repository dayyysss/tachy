export interface AuthUser {
  id: string
  email: string
  name: string
  username?: string | null
  displayUsername?: string | null
  role?: string | null
  image?: string | null
  isPublic?: boolean
  timezone?: string
  twoFactorEnabled?: boolean
}

export function useAuth() {
  const user = useState<AuthUser | null>('auth_user', () => null)
  const isLoaded = useState<boolean>('auth_loaded', () => false)

  async function fetchSession(): Promise<AuthUser | null> {
    try {
      const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
      const data = await $fetch<{ user?: AuthUser } | null>('/api/auth/get-session', {
        headers,
      })
      user.value = data?.user ?? null
      isLoaded.value = true
      return user.value
    } catch {
      user.value = null
      isLoaded.value = true
      return null
    }
  }

  async function signOut() {
    const toast = useToast()
    try {
      await $fetch('/api/auth/sign-out', { method: 'POST', body: {} })
    } finally {
      user.value = null
      toast.success('Signed out successfully.')
      await navigateTo('/')
    }
  }

  return {
    user,
    isLoaded,
    fetchSession,
    signOut,
  }
}
